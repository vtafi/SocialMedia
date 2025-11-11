import { Router } from 'express'
import { wrapAsync } from '~/utils/handler'
import { uploadImageController } from '~/controllers/media.controller'

const mediasRouter = Router()

mediasRouter.post('/upload-image', wrapAsync(uploadImageController))
export default mediasRouter
