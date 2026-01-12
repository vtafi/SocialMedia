import { model } from 'mongoose'
import { followerSchema } from './schemas/follower.schema'

const FollowersModel = model('Followers', followerSchema)
export default FollowersModel
