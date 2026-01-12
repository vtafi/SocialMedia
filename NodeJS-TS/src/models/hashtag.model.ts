import mongoose from 'mongoose'
import { hashtagSchema } from './schemas/hashtag.schema'

const HashtagModel = mongoose.model('Hashtag', hashtagSchema)
export default HashtagModel
