import { Request, Response } from 'express'
import formidable, { File } from 'formidable'
import path, { resolve } from 'path'
import { ErrorWithStatus } from './error'
import { fileMessages } from '~/constants/messages'
import httpStatus from '~/constants/httpStatus'

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve('uploads'),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 30 * 1024,
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
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new ErrorWithStatus({ message: fileMessages.FILE_EMPTY, status: httpStatus.BAD_REQUEST }))
      }
      resolve((files.image as File[])[0])
    })
  })
}
