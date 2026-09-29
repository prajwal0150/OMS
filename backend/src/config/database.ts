import mongoose from 'mongoose';
import { env } from './env';

let connection: typeof mongoose | null = null;

export const connectDatabase = async (uri: string = env.MONGODB_URI): Promise<typeof mongoose> => {
  if (connection) return connection;

  mongoose.set('strictQuery', true);
  // NOTE: `sanitizeFilter` is deliberately NOT enabled. It rewrites nested
  // operator objects such as { publishedAt: { $lte: new Date() } } into an
  // equality comparison, which makes Mongoose try to cast the whole object to
  // a Date and throws "Cast to date failed ... (type Object)". Every range and
  // comparison filter in this codebase depends on those operators.
  // Injection safety is handled upstream by Zod validation plus the Zod allow
  // lists in shared/validation.ts, which strip unknown query keys.
  if (env.isDevelopment) {
    mongoose.set('debug', false);
  }

  connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });

  // eslint-disable-next-line no-console
  console.log(`[database] connected -> ${mongoose.connection.name}`);
  return connection;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!connection) return;
  await mongoose.disconnect();
  connection = null;
};

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;
