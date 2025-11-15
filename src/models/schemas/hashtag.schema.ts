import { ObjectId, Schema } from 'mongoose'

interface Hashtag {
  _id?: ObjectId
  name: string
}

export const hashtagSchema = new Schema<Hashtag>(
  {
    name: { type: String, required: true, unique: true }
  },
  {
    timestamps: {
      createdAt: 'created_at'
    }
  }
)
