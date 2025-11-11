import { NextFunction, Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'
import httpStatus from '~/constants/httpStatus'
import { handleUploadImage } from '~/utils/files'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await handleUploadImage(req)
  return res.json({
    message: 'Upload image successfully',
    result: data
  })
}
