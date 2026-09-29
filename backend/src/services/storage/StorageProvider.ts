import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../../config/env';
import { slugify } from '../../utils/strings';

export interface StoredFile {
  key: string;
  url: string;
  folder: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageProvider: string;
}

export interface SaveFileInput {
  /** Temporary location produced by multer (or any local path). */
  tempPath: string;
  originalName: string;
  mimeType: string;
  folder: string;
  size: number;
}

export interface StorageProvider {
  readonly name: string;
  save(input: SaveFileInput): Promise<StoredFile>;
  remove(key: string): Promise<void>;
  getUrl(key: string): string;
}

const buildFileName = (originalName: string): string => {
  const extension = path.extname(originalName).toLowerCase();
  const base = slugify(path.basename(originalName, extension)) || 'file';
  const unique = crypto.randomBytes(8).toString('hex');
  return `${base}-${unique}${extension}`;
};

/**
 * Local disk storage used in development and for self hosted deployments.
 * Cloud providers only need to implement this same interface.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';

  private readonly root = env.uploadDirAbsolute;

  async save(input: SaveFileInput): Promise<StoredFile> {
    const safeFolder = slugify(input.folder) || 'misc';
    const destinationDir = path.join(this.root, safeFolder);
    await fs.mkdir(destinationDir, { recursive: true });

    const fileName = buildFileName(input.originalName);
    const destination = path.join(destinationDir, fileName);

    try {
      await fs.rename(input.tempPath, destination);
    } catch {
      // Cross device rename — copy then unlink the temporary file.
      await fs.copyFile(input.tempPath, destination);
      await fs.unlink(input.tempPath).catch(() => undefined);
    }

    const key = `${safeFolder}/${fileName}`;
    return {
      key,
      url: this.getUrl(key),
      folder: safeFolder,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      storageProvider: this.name,
    };
  }

  async remove(key: string): Promise<void> {
    const resolved = path.join(this.root, key);
    if (!resolved.startsWith(this.root)) return; // guard against path traversal
    await fs.unlink(resolved).catch(() => undefined);
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}

/**
 * Placeholder providers documenting the extension points. Implement `save`,
 * `remove` and `getUrl` with the provider SDK to switch storage backends.
 */
export class UnsupportedStorageProvider implements StorageProvider {
  constructor(readonly name: string) {}

  async save(): Promise<StoredFile> {
    throw new Error(
      `Storage provider "${this.name}" is not implemented. Configure a provider service or use STORAGE_PROVIDER=local.`,
    );
  }

  async remove(): Promise<void> {
    /* noop */
  }

  getUrl(key: string): string {
    return key;
  }
}
