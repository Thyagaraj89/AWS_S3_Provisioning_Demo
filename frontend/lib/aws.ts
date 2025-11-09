// frontend/lib/aws.ts
import { S3Client } from "@aws-sdk/client-s3";

export const awsRegion = process.env.AWS_REGION || "ap-southeast-1";

export const s3 = new S3Client({
  region: awsRegion,
  // uses AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from env automatically
});
