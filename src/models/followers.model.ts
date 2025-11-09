import { model } from 'mongoose'
import { followerSchema } from './schemas/followers.schema'

const FollowersModel = model('Followers', followerSchema)
export default FollowersModel
