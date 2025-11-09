import { z } from "zod";

export const provisionSchema = z.object({
  product: z.enum(["s3_bucket", "lambda"]),
  params: z.record(z.any()),
  region: z.string().default("ap-southeast-1"),
  action: z.enum(["apply","destroy"]).default("apply")
});
