import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const BUCKET = process.env.R2_BUCKET_NAME!
export const PUBLIC_URL = process.env.R2_PUBLIC_URL!

/**
 * Generate a pre-signed URL for direct client-side upload to R2.
 * The client uploads the file directly, avoiding proxying through Next.js.
 */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(R2, command, { expiresIn: 300 }) // 5 min
}

/**
 * Delete a file from R2 by key.
 */
export async function deleteFile(key: string): Promise<void> {
  await R2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}

/**
 * Build the public URL for an uploaded file.
 */
export function buildPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

/**
 * Generate a unique storage key for a case file.
 * Format: cases/{caseId}/{timestamp}-{filename}
 */
export function buildKey(caseId: string, filename: string): string {
  const timestamp = Date.now()
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `cases/${caseId}/${timestamp}-${clean}`
}
