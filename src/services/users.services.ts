import UserModel from '~/models/users.model'
import { User } from '~/models/schemas/user.schema'
import { RegisterRequestBody } from '~/models/requests/users.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'

export const UserService = {
  async signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN as any }
    })
  },
  async refreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.EXPIRES_IN_REFRESH_TOKEN as any }
    })
  },
  async register(userData: RegisterRequestBody) {
    try {
      const newUser = await UserModel.create({
        ...userData,
        date_of_birth: new Date(userData.date_of_birth),
        confirmPassword: undefined,
        password: hashPassword(userData.password)
      })
      const user_id = newUser._id.toString()
      const [accessToken, refreshToken] = await Promise.all([this.signAccessToken(user_id), this.refreshToken(user_id)])
      return { accessToken, refreshToken }
    } catch (error) {
      console.error('Service error details:', error)
      throw error
    }
  },

  async findByEmail(email: string) {
    try {
      const user = await UserModel.findOne({ email })
      return user
    } catch (error) {
      console.error('Service error details:', error)
      throw error
    }
  },

  async updateUser(userId: string, updateData: Partial<User>) {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true })
      return updatedUser
    } catch (error) {
      console.error('Service error details:', error)
      throw error
    }
  }
}
