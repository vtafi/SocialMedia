import { ObjectId, Schema } from 'mongoose'

interface Bookmark {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
}
export const bookmarkSchema = new Schema<Bookmark>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    tweet_id: { type: Schema.Types.ObjectId, required: true, ref: 'Tweet' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)
