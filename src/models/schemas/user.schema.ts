import { Schema, ObjectId } from 'mongoose'
import { gender, UserVeryfyStatus } from '~/constants/enum'

export interface User {
  _id?: ObjectId
  full_name: string
  email: string
  phone: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVeryfyStatus
  address: string
  avatar: string
  gender: gender
}

export const userSchema = new Schema<User>(
  {
    full_name: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    date_of_birth: { type: Date, default: Date.now },
    password: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    email_verify_token: { type: String, default: '' },
    forgot_password_token: { type: String, default: '' },
    verify: { type: Number, enum: UserVeryfyStatus, default: UserVeryfyStatus.Unverified },
    address: { type: String, default: '' },
    gender: { type: Number, enum: gender },
    avatar: { type: String, default: '' }
  },
  { timestamps: true }
)
