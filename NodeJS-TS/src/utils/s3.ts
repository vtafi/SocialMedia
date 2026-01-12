import { S3Client, ListBucketsCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import { Response } from 'express'
dotenv.config()
// Retrieve values from environment variables
const region = process.env.AWS_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error('Missing AWS configuration in environment variables.')
}

// Instantiate the S3 Client
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
})
// s3Client.send(new ListBucketsCommand()).then((data) => console.log(data.Buckets))
export const uploadFileToS3 = ({
  filename,
  filepath,
  contentType
}: {
  filename: string
  filepath: string
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      Body: fs.readFileSync(filepath),
      ContentType: contentType
    },

    // optional tags
    tags: [
      /*...*/
    ],

    // additional optional fields show default values below:

    // (optional) concurrency configuration
    queueSize: 4,

    // (optional) size of each part, in bytes, at least 5MB
    partSize: 1024 * 1024 * 5,

    // (optional) when true, do not automatically call AbortMultipartUpload when
    // a multipart upload fails to complete. You should then manually handle
    // the leftover parts.
    leavePartsOnError: false
  })
  return parallelUploads3.done()
}

/**
 * Stream file từ S3 về client (dùng server làm proxy)
 * @param res Express Response object
 * @param filepath Đường dẫn file trên S3 (Key)
 */
export const sendFileFromS3 = async (res: Response, filepath: string) => {
  try {
    const data = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filepath
      })
    )
    // Pipe stream từ S3 về client
    // Note: Phải ép kiểu as any vì AWS SDK v3 TypeScript definition thiếu .pipe()
    ;(data.Body as any).pipe(res)
  } catch (error) {
    console.error('Error streaming from S3:', error)
    res.status(404).send('File not found')
  }
}
