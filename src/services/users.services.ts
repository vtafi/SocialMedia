import UserModel from '~/models/users.model'
import { User } from '~/models/schemas/user.schema'
import { RegisterRequestBody } from '~/models/requests/users.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import mongoose from 'mongoose'
import RefreshTokenModel from '~/models/refreshToken.model'
import { ObjectId } from 'mongodb'

export const UserService = {
  async login(user_id: string) {
    const [accessToken, refreshToken] = await UserService.signAccessTokenAndrefreshToken(user_id)
    await RefreshTokenModel.deleteMany({ user_id: new ObjectId(user_id) })

    await RefreshTokenModel.create({
      user_id: new ObjectId(user_id),
      token: refreshToken
    })

    return { accessToken, refreshToken }
  },

  async signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN as any }
    })
  },
  async signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.EXPIRES_IN_REFRESH_TOKEN as any }
    })
  },
  // Giả sử hàm này bạn đã sửa tên, hoặc chắc chắn nó là đúng
  async signAccessTokenAndrefreshToken(user_id: string) {
    return Promise.all([
      this.signAccessToken(user_id),
      // Tôi giả định tên đúng phải là "sign"
      this.signRefreshToken(user_id)
    ])
  },

  async register(userData: RegisterRequestBody) {
    const session = await mongoose.startSession()
    session.startTransaction()

    let newUser: any // Khai báo newUser ở ngoài để có thể dùng sau khi commit

    try {
      // 3. TẠO USER (trong transaction)
      const createdUsers = await UserModel.create(
        [
          {
            ...userData,
            date_of_birth: new Date(userData.date_of_birth),
            confirmPassword: undefined,
            password: hashPassword(userData.password)
          }
        ],
        { session }
      )

      newUser = createdUsers[0] // Lấy user ra
      const user_id = newUser._id

      const [accessToken, refreshToken] = await UserService.signAccessTokenAndrefreshToken(newUser._id.toString())
      await RefreshTokenModel.create({
        user_id: newUser._id,
        token: refreshToken
      })

      // 5. Nếu cả hai thành công, commit transaction
      await session.commitTransaction()
      return { accessToken, refreshToken }
    } catch (error: any) {
      // 7. Nếu có bất kỳ lỗi nào (ví dụ: trùng email), HỦY BỎ transaction
      await session.abortTransaction()

      // 8. QUAN TRỌNG: Ném lỗi ra ngoài để controller bắt được
      throw error
    } finally {
      // 9. Luôn luôn kết thúc session
      session.endSession()
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
