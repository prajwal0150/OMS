import { z } from 'zod';
import { AUDIT_ACTION } from '../../constants/enums';
import { optionalString, paginationSchema } from '../../shared/validation';

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.enum(Object.values(AUDIT_ACTION) as [string, ...string[]]).optional(),
  entity: optionalString(60),
  actor: optionalString(40),
  from: optionalString(40),
  to: optionalString(40),
});
