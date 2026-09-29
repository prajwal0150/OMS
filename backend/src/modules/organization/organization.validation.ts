import { z } from 'zod';
import { optionalDateSchema, optionalString, optionalUrl, phoneSchema, requiredString } from '../../shared/validation';

export const updateOrganizationSchema = z.object({
  name: requiredString(3, 150).optional(),
  shortName: optionalString(60),
  description: optionalString(2000),
  logo: optionalString(400),
  establishedDate: optionalDateSchema,
  district: optionalString(40),
  province: optionalString(60),
  country: optionalString(60),
  address: optionalString(300),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  website: optionalUrl,
  socialLinks: z
    .object({
      facebook: optionalUrl,
      instagram: optionalUrl,
      youtube: optionalUrl,
      twitter: optionalUrl,
      linkedin: optionalUrl,
    })
    .partial()
    .optional(),
  active: z.boolean().optional(),
});
