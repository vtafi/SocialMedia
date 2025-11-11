import { NextFunction, Request, Response } from 'express'
import { imageMessages } from '~/constants/messages'
import { MediaService } from '~/services/media.service'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await MediaService.uploadImage(req)
  return res.json({
    message: imageMessages.IMAGE_UPLOADED_SUCCESSFULLY,
    result: url
  })
}
