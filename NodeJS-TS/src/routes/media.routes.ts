import { Router } from 'express'
import { wrapAsync } from '~/utils/handler'
import { uploadImageController, uploadVideoController, uploadVideoHLSController } from '~/controllers/media.controller'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares'

const mediasRouter = Router()

mediasRouter.post('/upload-image', accessTokenValidator, verifyUserValidator, wrapAsync(uploadImageController))

mediasRouter.post('/upload-video', accessTokenValidator, verifyUserValidator, wrapAsync(uploadVideoController))

mediasRouter.post('/upload-video-hls', accessTokenValidator, verifyUserValidator, wrapAsync(uploadVideoHLSController))

export default mediasRouter
