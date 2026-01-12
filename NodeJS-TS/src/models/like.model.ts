import mongoose from 'mongoose'
import { likeSchema } from './schemas/like.schema'

const LikeModel = mongoose.model('Likes', likeSchema)
export default LikeModel
