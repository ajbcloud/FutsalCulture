import { z } from 'zod';
export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issues = r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`validation failed: ${issues}`);
  }
  return r.data as z.infer<T>;
}