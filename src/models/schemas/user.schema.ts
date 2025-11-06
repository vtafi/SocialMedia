import { Schema, ObjectId } from 'mongoose'
import { UserVerifyStatus } from '~/constants/enum'

export interface User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date | null
  password: string | null
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string
}

export const userSchema = new Schema<User>(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    date_of_birth: { type: Date, default: null },
    password: { type: String, default: null, select: false },

    email_verify_token: { type: String, default: '' },
    forgot_password_token: { type: String, default: '', select: false },
    verify: { type: Number, enum: UserVerifyStatus, default: UserVerifyStatus.Unverified },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    username: { type: String, default: '' },
    avatar: { type: String, default: '' },
    cover_photo: { type: String, default: '' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)
