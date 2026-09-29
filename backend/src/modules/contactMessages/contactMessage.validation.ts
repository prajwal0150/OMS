import { z } from 'zod';
import { CONTACT_STATUS } from '../../constants/enums';
import { paginationSchema } from '../../shared/validation';

/** Public contact page submission. */
export const createContactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.string().trim().email('Enter a valid email address').max(160),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  subject: z.string().trim().min(3, 'Enter a subject').max(200),
  message: z.string().trim().min(10, 'Tell us a little more').max(4000),
  // Honeypot: bots fill hidden inputs, humans never see this one.
  website: z.string().max(0).optional(),
});

export const contactMessageListQuerySchema = paginationSchema.extend({
  status: z.enum(Object.values(CONTACT_STATUS) as [string, ...string[]]).optional(),
  search: z.string().trim().max(150).optional(),
});

export const updateContactMessageSchema = z.object({
  status: z.enum(Object.values(CONTACT_STATUS) as [string, ...string[]]).optional(),
  replyNote: z.string().trim().max(2000).optional(),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
export type UpdateContactMessageInput = z.infer<typeof updateContactMessageSchema>;
