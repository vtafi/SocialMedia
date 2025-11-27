import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/files'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enum'
import { Media } from '~/models/other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import fsPromise from 'fs/promises'
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
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return results
  },
  async uploadVideo(req: Request) {
    const { files } = await handleUploadVideo(req)
    const newName = files[0].newFilename
    return {
      url: isProduction
        ? `${process.env.HOST}/static/video-stream/${newName}`
        : `http://localhost:${process.env.PORT}/static/video-stream/${newName}`,
      type: MediaType.Video
    }
  },
  async uploadVideoHLS(req: Request) {
    const { idName, files } = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        queue.enqueue(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${idName}.m3u8`
            : `http://localhost:${process.env.PORT}/static/video-hls/${idName}.m3u8`,
          type: MediaType.VideoHLS
        }
      })
    )
    return result
  }
}
