import { z } from "zod";

const PersonNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    name: z.string(),
    gender: z.enum(["male", "female"]),
    detail: z.string(),
    generation: z.number().optional(),
    children: z.array(PersonNodeSchema),
  })
);

export const GenealogySchema = z.array(PersonNodeSchema);

export const DocumentItemSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const DocumentsSchema = z.record(z.string(), DocumentItemSchema);

export const PhotoMapEntrySchema = z.object({
  self: z.string().optional(),
  spouse: z.string().optional(),
  spouse_name: z.string().optional(),
});

export const PhotoMapSchema = z.record(z.string(), PhotoMapEntrySchema);

export function validateData(data: unknown, schema: z.ZodSchema, label: string) {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[数据校验失败] ${label}:`, result.error.issues);
    return false;
  }
  console.log(`[数据校验通过] ${label}`);
  return true;
}
