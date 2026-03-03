import { z } from 'zod';

export const storeIdSchema = z.string().min(1).max(128);
export const productIdSchema = z.string().min(1).max(128);

export const productLinkItemSchema = z.object({
  productId: productIdSchema,
  buttonText: z.string().max(120).nullable().optional(),
  buttonUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  openNewTab: z.boolean().optional()
}).superRefine((value, ctx) => {
  const url = value.buttonUrl;
  if (typeof url === 'string' && url.length > 0 && !/^https?:\/\//i.test(url)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'buttonUrl must start with http/https', path: ['buttonUrl'] });
  }
});

export const bulkSchema = z.object({
  store_id: storeIdSchema,
  items: z.array(productLinkItemSchema).min(1)
});
