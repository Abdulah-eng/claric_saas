import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      ...(process.env.AWS_ENDPOINT_URL
        ? { endpoint: process.env.AWS_ENDPOINT_URL, forcePathStyle: true }
        : {}),
    })
  }
  return s3Client
}

const BUCKET = process.env.AWS_S3_BUCKET!

export type UploadFileOptions = {
  tenantId: string
  folder: 'artwork' | 'documents' | 'avatars' | 'invoices' | 'quotes' | 'products'
  fileName: string
  contentType: string
  body: Buffer | Uint8Array | string
  isPublic?: boolean
}

export async function uploadFile(options: UploadFileOptions): Promise<{ key: string; url: string }> {
  const client = getS3Client()
  const ext = options.fileName.split('.').pop()
  const key = `${options.tenantId}/${options.folder}/${uuidv4()}.${ext}`

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: options.body,
      ContentType: options.contentType,
      Metadata: {
        tenantId: options.tenantId,
        originalName: options.fileName,
      },
    })
  )

  const url = process.env.AWS_ENDPOINT_URL
    ? `${process.env.AWS_ENDPOINT_URL}/${BUCKET}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

  return { key, url }
}

/**
 * Generate a pre-signed download URL (expires in 15 minutes by default).
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 900): Promise<string> {
  const client = getS3Client()
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Generate a pre-signed upload URL for direct browser uploads.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn })
}

export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/**
 * Extract the S3 key from a full URL.
 */
export function extractKeyFromUrl(url: string): string {
  const urlObj = new URL(url)
  return urlObj.pathname.slice(1) // remove leading /
}
