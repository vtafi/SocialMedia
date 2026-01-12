import { ObjectId, Schema } from 'mongoose'

interface Follower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at: Date
}

export const followerSchema = new Schema<Follower>({
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  followed_user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  created_at: { type: Date, default: Date.now }
})
