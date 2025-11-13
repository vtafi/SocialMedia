import { Router } from 'express'
import { wrapAsync } from '~/utils/handler'
import { uploadImageController, uploadVideoController } from '~/controllers/media.controller'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares'

const mediasRouter = Router()

mediasRouter.post('/upload-image', accessTokenValidator, verifyUserValidator, wrapAsync(uploadImageController))

mediasRouter.post('/upload-video', accessTokenValidator, verifyUserValidator, wrapAsync(uploadVideoController))

export default mediasRouter
