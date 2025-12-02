import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
import {Upload} from '@aws-sdk/lib-storage'
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
try {
  const parallelUploads3 = new Upload({
    client: s3Client,
    params: { Bucket: 'twitter-nodejs-1', Key, Body },

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
    leavePartsOnError: false,
  });

  parallelUploads3.on("httpUploadProgress", (progress) => {
    console.log(progress);
  });

  await parallelUploads3.done();

