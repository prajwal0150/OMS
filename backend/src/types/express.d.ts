import type { AuthUser } from './auth';
import type { StoredFile } from '../services/storage/StorageProvider';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware. */
      user?: AuthUser;
      /** Populated by `authenticate` — organization scope of the current user. */
      scope?: {
        district?: string;
        unit?: string;
        community?: string;
        committee?: string;
      };
      requestId?: string;
      /** Populated by the upload middleware after files reach the storage provider. */
      uploadedFiles?: StoredFile[];
    }
  }
}

export {};

