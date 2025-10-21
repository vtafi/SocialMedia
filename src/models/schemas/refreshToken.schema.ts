import { ObjectId, Schema, model } from 'mongoose'

// Interface vẫn giữ nguyên
export interface RefreshToken {
  _id?: ObjectId
  token: string
  createdAt?: Date
  user_id: ObjectId
}

// Schema đã bỏ trường _id thừa
export const refreshTokenSchema = new Schema<RefreshToken>({
  // Mongoose tự động xử lý _id
  token: { type: String, required: true, unique: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' }
})
