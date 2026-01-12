import { Request, Response } from 'express'
import formidable, { File } from 'formidable'
import { ErrorWithStatus } from './error'
import { fileMessages } from '~/constants/messages'
import httpStatus from '~/constants/httpStatus'
import fs from 'fs'
import { UPLOAD_IMAGE_DIR, UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import path from 'path'
import { nanoid } from 'nanoid'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    maxTotalFileSize: 10 * 1024 * 1024 * 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image'))
      if (!valid)
        form.emit(
          'error' as any,
          new ErrorWithStatus({ message: fileMessages.FILE_TYPE_NOT_VALID, status: httpStatus.BAD_REQUEST }) as any
        )
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new ErrorWithStatus({ message: fileMessages.FILE_EMPTY, status: httpStatus.BAD_REQUEST }))
      }
      resolve(files.image as File[])
    })
  })
}
export const handleUploadVideo = async (req: Request) => {
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath, { recursive: true })
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 500 * 1024 * 1024,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('mov'))
      if (!valid)
        form.emit(
          'error' as any,
          new ErrorWithStatus({ message: fileMessages.FILE_TYPE_NOT_VALID, status: httpStatus.BAD_REQUEST }) as any
        )
      return valid
    }
  })
  return new Promise<{ idName: string; files: File[] }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new ErrorWithStatus({ message: fileMessages.FILE_EMPTY, status: httpStatus.BAD_REQUEST }))
      }
      resolve({ idName, files: files.video as File[] })
    })
  })
}

export const getNameFromFullName = (fullName: string) => {
  const nameArray = fullName.split('.')
  nameArray.pop()
  return nameArray.join('.')
}

export const getExtensionFromFullName = (fullName: string) => {
  const nameArray = fullName.split('.')
  return nameArray.pop()
}

/**
 * Quét đệ quy tất cả file trong thư mục (bao gồm thư mục con)
 * @param dir Đường dẫn thư mục cần quét
 * @returns Mảng chứa đường dẫn tuyệt đối của tất cả file
 */
export const getFiles = (dir: string, files: string[] = []): string[] => {
  const fileList = fs.readdirSync(dir)
  for (const file of fileList) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      // Nếu là thư mục, gọi đệ quy
      getFiles(filePath, files)
    } else {
      // Nếu là file, thêm vào mảng
      files.push(filePath)
    }
  }
  return files
}
