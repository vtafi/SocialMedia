import mongoose from 'mongoose'
import { userSchema } from './schemas/user.schema'

const UserModel = mongoose.model('Users', userSchema)

export default UserModel
