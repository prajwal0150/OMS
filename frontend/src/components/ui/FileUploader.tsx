import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { FileUp, Paperclip, X } from 'lucide-react';
import { Button } from './Button';
import { resolveAssetUrl } from '../../services/api/httpClient';

export interface UploadedFilePreview {
  name: string;
  size?: number;
  url?: string;
}

/**
 * Compact drag & drop upload area: `rounded-lg border-dashed`, small preview
 * list with remove buttons, and client-side size validation.
 */
export interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  previews?: UploadedFilePreview[];
  uploading?: boolean;
  uploadProgress?: number;
  onUpload?: () => void;
}

const formatSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileUploader({
  accept,
  multiple = false,
  maxSizeMb = 25,
  disabled = false,
  label = 'Upload files',
  hint,
  files,
  onFilesChange,
  previews,
  uploading = false,
  uploadProgress,
  onUpload,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const list = Array.from(incoming);
    const tooLarge = list.find((file) => file.size > maxSizeMb * 1024 * 1024);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is larger than the ${maxSizeMb} MB limit.`);
      return;
    }
    setError(null);
    onFilesChange(multiple ? [...files, ...list] : list.slice(0, 1));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) acceptFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed p-4 text-center transition-colors ${
          dragging ? 'border-primary bg-primary-soft' : 'border-line bg-slate-50/60'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <FileUp className="mx-auto h-5 w-5 text-slate-400" aria-hidden />
        <p className="mt-1.5 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-primary hover:underline"
          >
            {label}
          </button>{' '}
          <span className="text-muted">or drag and drop</span>
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            acceptFiles(event.target.files);
            event.target.value = '';
          }}
          aria-label={label}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => {
            const preview = previews?.[index];
            return (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5"
              >
                {preview?.url ? (
                  <img
                    src={resolveAssetUrl(preview.url)}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{file.name}</span>
                <span className="shrink-0 text-xs text-muted">{formatSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:text-danger"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {onUpload && files.length > 0 && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onUpload} loading={uploading}>
            {uploading ? 'Uploading⬦' : 'Upload'}
          </Button>
          {uploading && (
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${uploadProgress ?? 60}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface ImageGalleryProps {
  images: Array<{ url: string; caption?: string; alt?: string }>;
  columns?: 2 | 3 | 4;
  children?: ReactNode;
}

export function ImageGallery({ images, columns = 3, children }: ImageGalleryProps) {
  if (images.length === 0) {
    return <p className="text-sm text-muted">No images attached.</p>;
  }
  const gridClass =
    columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <div className="space-y-3">
      <div className={`grid grid-cols-2 gap-2 ${gridClass}`}>
        {images.map((image, index) => (
          <figure key={`${image.url}-${index}`} className="overflow-hidden rounded-lg border border-line">
            <img
              src={resolveAssetUrl(image.url)}
              alt={image.alt ?? image.caption ?? ''}
              loading="lazy"
              className="h-32 w-full object-cover"
            />
            {image.caption && (
              <figcaption className="px-2 py-1 text-xs text-muted">{image.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
      {children}
    </div>
  );
}
