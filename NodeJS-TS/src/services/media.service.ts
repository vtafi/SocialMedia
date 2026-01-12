import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage, handleUploadVideo, getFiles } from '~/utils/files'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enum'
import { Media } from '~/models/other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import fsPromise from 'fs/promises'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'
import { rimrafSync } from 'rimraf'
config()
class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  enqueue(item: string) {
    this.items.push(item)
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        await fsPromise.unlink(videoPath)
        console.log(`Encoded ${videoPath}`)
      } catch (error) {
        console.error(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('No more videos to encode')
    }
  }
}
const queue = new Queue()
export const MediaService = {
  async uploadImage(req: Request) {
    const file = await handleUploadImage(req)
    const results: Media[] = await Promise.all(
      file.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newFullFileName = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await uploadFileToS3({
          filename: 'images/' + newFullFileName,
          filepath: newPath,
          contentType: mime.getType(newFullFileName) as string
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: s3Result.Location as string,
          type: MediaType.Image
        }
        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/image/${newFullFileName}`
        //     : `http://localhost:${process.env.PORT}/static/image/${newFullFileName}`,
        //   type: MediaType.Image
        // }
      })
    )
    return results
  },
  async uploadVideo(req: Request) {
    const { files } = await handleUploadVideo(req)
    const results: Media[] = await Promise.all(
      files.map(async (file) => {
        const S3Result = await uploadFileToS3({
          filename: 'videos/' + file.newFilename,
          filepath: file.filepath,
          contentType: mime.getType(file.newFilename) as string
        })
        return {
          url: S3Result.Location as string,
          type: MediaType.Video
        }
      })
    )
    return results
  },
  async uploadVideoHLS(req: Request) {
    const { idName, files } = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        // Enqueue video gốc để encode HLS
        const videoPath = file.filepath
        queue.enqueue(videoPath)

        // Đường dẫn thư mục output HLS
        const hlsOutputDir = path.resolve(UPLOAD_VIDEO_DIR, idName)

        // Đợi cho Queue xóa file video gốc (signal encode đã xong)
        // Queue xóa file ở line 36: await fsPromise.unlink(videoPath)
        let attempts = 0
        while (fs.existsSync(videoPath) && attempts < 300) {
          // Đợi tối đa 5 phút
          await new Promise((resolve) => setTimeout(resolve, 1000))
          attempts++
        }

        if (fs.existsSync(videoPath)) {
          throw new Error(`HLS encoding timeout for video ${idName}`)
        }

        // Double check: Đợi thêm 2s để ffmpeg finalize tất cả files
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Verify master.m3u8 có tồn tại
        const masterPath = path.join(hlsOutputDir, 'master.m3u8')
        if (!fs.existsSync(masterPath)) {
          throw new Error(`HLS master playlist not found for ${idName}`)
        }

        // Lấy tất cả file HLS trong thư mục (bao gồm cả subdirs)
        const hlsFiles = getFiles(hlsOutputDir)

        // Upload song song tất cả file HLS lên S3
        await Promise.all(
          hlsFiles.map(async (filePath) => {
            // Tạo S3 key: videos-hls/idName/master.m3u8, videos-hls/idName/v0/...
            const relativePath = path.relative(UPLOAD_VIDEO_DIR, filePath)
            const s3Key = `videos-hls/${relativePath.replace(/\\/g, '/')}`

            await uploadFileToS3({
              filename: s3Key,
              filepath: filePath,
              contentType: mime.getType(filePath) || 'application/octet-stream'
            })
          })
        )

        // Xóa thư mục HLS output sau khi upload lên S3 thành công
        rimrafSync(hlsOutputDir)
        console.log(`✅ Uploaded and cleaned up HLS files for ${idName}`)

        // Trả về URL stream từ S3 (qua proxy server)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${idName}/master.m3u8`
            : `http://localhost:${process.env.PORT}/static/video-hls/${idName}/master.m3u8`,
          type: MediaType.VideoHLS
        }
      })
    )
    return result
  }
}
