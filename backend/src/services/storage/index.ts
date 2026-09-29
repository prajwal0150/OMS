import { env } from '../../config/env';
import { LocalStorageProvider, UnsupportedStorageProvider } from './StorageProvider';
import type { StorageProvider } from './StorageProvider';

let provider: StorageProvider | null = null;

/**
 * Storage factory — controllers and services depend on the interface only,
 * never on a concrete provider (local disk today, Cloudinary/S3 tomorrow).
 */
export const getStorageProvider = (): StorageProvider => {
  if (provider) return provider;
  switch (env.STORAGE_PROVIDER) {
    case 'local':
      provider = new LocalStorageProvider();
      break;
    case 'cloudinary':
      provider = new UnsupportedStorageProvider('cloudinary');
      break;
    case 's3':
      provider = new UnsupportedStorageProvider('s3');
      break;
    default:
      provider = new LocalStorageProvider();
  }
  return provider;
};

/** Test helper. */
export const setStorageProvider = (next: StorageProvider | null): void => {
  provider = next;
};

export * from './StorageProvider';
