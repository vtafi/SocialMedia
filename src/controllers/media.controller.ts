import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import httpStatus from '~/constants/httpStatus'
import { imageMessages, videoMessages } from '~/constants/messages'
import { MediaService } from '~/services/media.service'
import fs from 'fs'
import mime from 'mime'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await MediaService.uploadImage(req)
  return res.json({
    message: imageMessages.IMAGE_UPLOADED_SUCCESSFULLY,
    result: url
  })
}
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await MediaService.uploadVideo(req)
  return res.json({
    message: videoMessages.VIDEO_UPLOADED_SUCCESSFULLY,
    result: url
  })
}
export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await MediaService.uploadVideoHLS(req)
  return res.json({
    message: videoMessages.VIDEO_UPLOADED_SUCCESSFULLY,
    result: url
  })
}
export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: imageMessages.IMAGE_NOT_FOUND
      })
    }
  })
}
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)

  // Kiểm tra file tồn tại
  if (!fs.existsSync(videoPath)) {
    return res.status(httpStatus.NOT_FOUND).json({
      message: 'Video not found'
    })
  }

  const videoSize = fs.statSync(videoPath).size
  const contentType = mime.getType(videoPath) || 'video/*'

  // Nếu không có range header, serve toàn bộ video
  if (!range) {
    const headers = {
      'Content-Length': videoSize,
      'Content-Type': contentType
    }
    res.writeHead(httpStatus.OK, headers)
    const videoStream = fs.createReadStream(videoPath)
    return videoStream.pipe(res)
  }

  // Có range header, stream từng chunk
  const CHUNK_SIZE = 10 ** 6 // 1MB
  const start = Number(range.replace(/bytes=/, '').split('-')[0])
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

  const contentLength = end - start + 1
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(httpStatus.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
export const serveM3U8Controller = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
    if (err) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: imageMessages.IMAGE_NOT_FOUND
      })
    }
  })
}
export const serveSegmentController = (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
    if (err) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: imageMessages.IMAGE_NOT_FOUND
      })
    }
  })
}
