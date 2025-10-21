import mongoose from 'mongoose'
import { refreshTokenSchema } from './schemas/refreshToken.schema'

const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema)

export default RefreshTokenModel
