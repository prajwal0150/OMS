import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { env } from '../config/env';
import { getStorageProvider } from '../services/storage';
import { ApiError } from '../utils/ApiError';

export type UploadKind = 'image' | 'video' | 'document' | 'media';

const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
];

export const allowedMimeTypes = (kind: UploadKind): string[] => {
  switch (kind) {
    case 'image':
      return IMAGE_MIME_TYPES;
    case 'video':
      return VIDEO_MIME_TYPES;
    case 'document':
      return DOCUMENT_MIME_TYPES;
    case 'media':
      return [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...DOCUMENT_MIME_TYPES];
  }
};

export const maxSizeBytes = (kind: UploadKind): number => {
  switch (kind) {
    case 'image':
      return env.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    case 'video':
      return env.MAX_VIDEO_SIZE_MB * 1024 * 1024;
    default:
      return env.MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
  }
};

export const categoryForMime = (mime: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' => {
  if (IMAGE_MIME_TYPES.includes(mime)) return 'IMAGE';
  if (VIDEO_MIME_TYPES.includes(mime)) return 'VIDEO';
  return 'DOCUMENT';
};

const tempDirectory = path.join(env.uploadDirAbsolute, 'tmp');

if (!fs.existsSync(tempDirectory)) {
  fs.mkdirSync(tempDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, tempDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`);
  },
});

const fileFilterFor =
  (kind: UploadKind) =>
  (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback): void => {
    const allowed = allowedMimeTypes(kind);
    if (!allowed.includes(file.mimetype)) {
      callback(
        ApiError.badRequest(
          `Unsupported file type "${file.mimetype}". Allowed: ${allowed.join(', ')}`,
        ),
      );
      return;
    }
    callback(null, true);
  };

const createUploader = (kind: UploadKind) =>
  multer({
    storage,
    fileFilter: fileFilterFor(kind),
    limits: { fileSize: maxSizeBytes(kind), files: 20 },
  });

/** Persists multer temporary files through the configured storage provider. */
export const persistUploads =
  (folder: string): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const files: Express.Multer.File[] = [];
      if (req.file) files.push(req.file);
      if (Array.isArray(req.files)) files.push(...req.files);
      else if (req.files && typeof req.files === 'object') {
        files.push(...Object.values(req.files).flat());
      }

      if (files.length === 0) {
        next();
        return;
      }

      const provider = getStorageProvider();
      const stored = [];
      for (const file of files) {
        stored.push(
          await provider.save({
            tempPath: file.path,
            originalName: file.originalname,
            mimeType: file.mimetype,
            folder,
            size: file.size,
          }),
        );
      }
      req.uploadedFiles = stored;
      next();
    } catch (error) {
      next(error);
    }
  };

/** Single file upload pipeline: validate → receive → persist to storage. */
export const uploadSingle = (
  kind: UploadKind,
  fieldName = 'file',
  folder = 'misc',
): RequestHandler[] => [createUploader(kind).single(fieldName), persistUploads(folder)];

/** Multiple file upload pipeline (defaults to twelve files). */
export const uploadMany = (
  kind: UploadKind,
  fieldName = 'files',
  maxCount = 12,
  folder = 'misc',
): RequestHandler[] => [createUploader(kind).array(fieldName, maxCount), persistUploads(folder)];
