import { ObjectId, Schema, model } from 'mongoose'

export interface RefreshToken {
  _id?: ObjectId
  token: string
  expiresAt?: Date
  isRevoked?: boolean
  createdAt?: Date
  user_id: ObjectId
}

export const refreshTokenSchema = new Schema<RefreshToken>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      index: true // Để dễ query token hết hạn
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'refresh_tokens'
  }
)
