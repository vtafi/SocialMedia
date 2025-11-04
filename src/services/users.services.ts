import UserModel from '~/models/users.model'
import { User } from '~/models/schemas/user.schema'
import { RegisterRequestBody } from '~/models/requests/users.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import mongoose from 'mongoose'
import RefreshTokenModel from '~/models/refreshToken.model'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { userMessages } from '~/constants/messages'
import axios from 'axios'
import { ErrorWithStatus } from '~/utils/errors'
import httpStatus from '~/constants/httpStatus'
import jwt from 'jsonwebtoken'

config()
export const UserService = {
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [accessToken, refreshToken] = await UserService.signAccessTokenAndrefreshToken({
      user_id,
      verify
    })
    await RefreshTokenModel.deleteMany({ user_id: new ObjectId(user_id) })

    await RefreshTokenModel.create({
      user_id: new ObjectId(user_id),
      token: refreshToken
    })

    return { accessToken, refreshToken }
  },
  async oauthGoogle(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: userMessages.EMAIL_NOT_VERIFIED,
        status: httpStatus.BAD_REQUEST
      })
    }
    const user = await UserModel.findOne({ email: userInfo.email })
    if (user) {
      const [accessToken, refreshToken] = await UserService.signAccessTokenAndrefreshToken({
        user_id: user._id.toString(),
        verify: UserVerifyStatus.Verified
      })
      await RefreshTokenModel.deleteMany({ user_id: user._id })
      await RefreshTokenModel.create({
        user_id: user._id,
        token: refreshToken
      })
      return { accessToken, refreshToken, newUser: false }
    } else {
      const user_id = new mongoose.Types.ObjectId().toString()
      await UserModel.create({
        _id: user_id,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        email_verify_token: '',
        date_of_birth: null,
        password: null,
        verify: UserVerifyStatus.Verified
      })
      const [accessToken, refreshToken] = await UserService.signAccessTokenAndrefreshToken({
        user_id,
        verify: UserVerifyStatus.Unverified
      })
      await RefreshTokenModel.create({
        user_id: new mongoose.Types.ObjectId(user_id),
        token: refreshToken
      })
      return { accessToken, refreshToken, newUser: true }
    }
  },
  async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as { access_token: string; id_token: string }
  },
  async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as { email: string; verified_email: boolean; id: string; name: string; picture: string; locale: string }
  },
  async signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, verify, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.EXPIRES_IN_ACCESS_TOKEN as any }
    })
  },
  async signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, verify, token_type: TokenType.RefreshToken },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.EXPIRES_IN_REFRESH_TOKEN as any }
    })
  },
  async signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, verify, token_type: TokenType.EmailVerifyToken },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.EXPIRES_IN_EMAIL_VERIFY_TOKEN as any }
    })
  },
  async signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, verify, token_type: TokenType.ForgotPasswordToken },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.EXPIRES_IN_FORGOT_PASSWORD_TOKEN as any }
    })
  },
  async signAccessTokenAndrefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify }),
      // Tôi giả định tên đúng phải là "sign"
      this.signRefreshToken({ user_id, verify })
    ])
  },
  async logout(refreshToken: string) {
    const result = await RefreshTokenModel.deleteOne({ token: refreshToken })
    console.log('Logout result:', result)
    return {
      message: userMessages.LOGOUT_SUCCESSFUL
    }
  },
  async register(userData: RegisterRequestBody) {
    const user_id = new mongoose.Types.ObjectId().toString()
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    const session = await mongoose.startSession()
    session.startTransaction()

    let newUser: any // Khai báo newUser ở ngoài để có thể dùng sau khi commit

    try {
      // 3. TẠO USER (trong transaction)
      await UserModel.create(
        [
          {
            ...userData,
            _id: user_id,
            email_verify_token,
            date_of_birth: new Date(userData.date_of_birth),
            confirmPassword: undefined,
            password: hashPassword(userData.password)
          }
        ],
        { session }
      )

      // Lấy user ra
      const [accessToken, refreshToken] = await UserService.signAccessTokenAndrefreshToken({
        user_id,
        verify: UserVerifyStatus.Unverified
      })
      await RefreshTokenModel.create({
        user_id: new mongoose.Types.ObjectId(user_id),
        token: refreshToken
      })
      console.log('email_verify_token', email_verify_token)
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
  },
  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessTokenAndrefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      UserModel.findByIdAndUpdate(
        user_id,
        {
          email_verify_token: '',
          verify: UserVerifyStatus.Verified
        },
        { $currentDate: { updated_at: true } }
      )
    ])
    const [accessToken, refreshToken] = token
    return {
      accessToken,
      refreshToken
    }
  },
  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    console.log('email_verify_token', email_verify_token)
    await UserModel.findByIdAndUpdate(user_id, { email_verify_token }, { $currentDate: { updated_at: true } })
    return {
      message: userMessages.RESEND_EMAIL_VERIFIED_SUCCESSFULLY
    }
  },
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await UserModel.findByIdAndUpdate(user_id, { forgot_password_token }, { $currentDate: { updated_at: true } })
    console.log('forgot_password_token', forgot_password_token)
    return {
      message: userMessages.FORGOT_PASSWORD_EMAIL_SENT_SUCCESSFULLY
    }
  },
  async resetPassword(user_id: string, newPassword: string) {
    await UserModel.findByIdAndUpdate(
      user_id,
      { password: hashPassword(newPassword), forgot_password_token: '' },
      { $currentDate: { updated_at: true } }
    )
    return {
      message: userMessages.RESET_PASSWORD_SUCCESSFULLY
    }
  },
  async refreshToken(refreshToken: string) {
    // 1️⃣ Verify refresh token signature
    let decoded
    try {
      decoded = await verifyToken({
        token: refreshToken,
        publicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    } catch (error: any) {
      // ❌ Test Case: Invalid refresh token signature
      throw new ErrorWithStatus({
        message: userMessages.REFRESH_TOKEN_INVALID,
        status: httpStatus.UNAUTHORIZED
      })
    }

    // 2️⃣ Kiểm tra token type phải là RefreshToken
    if (decoded.token_type !== TokenType.RefreshToken) {
      throw new ErrorWithStatus({
        message: userMessages.REFRESH_TOKEN_INVALID,
        status: httpStatus.UNAUTHORIZED
      })
    }

    // 3️⃣ Tìm refresh token trong database
    const storedToken = await RefreshTokenModel.findOne({
      token: refreshToken,
      user_id: new ObjectId(decoded.user_id)
    })

    // ❌ Test Case: Refresh token not in database
    if (!storedToken) {
      throw new ErrorWithStatus({
        message: userMessages.REFRESH_TOKEN_NOT_FOUND,
        status: httpStatus.UNAUTHORIZED
      })
    }

    // 4️⃣ Kiểm tra token đã bị revoke chưa
    if (storedToken.isRevoked) {
      throw new ErrorWithStatus({
        message: userMessages.REFRESH_TOKEN_REVOKED,
        status: httpStatus.UNAUTHORIZED
      })
    }

    // 5️⃣ Kiểm tra token đã hết hạn chưa (nếu có field expiresAt)
    if (storedToken.expiresAt && storedToken.expiresAt < new Date()) {
      // ❌ Test Case: Expired refresh token
      // Xóa token hết hạn khỏi DB
      await RefreshTokenModel.deleteOne({ _id: storedToken._id })

      throw new ErrorWithStatus({
        message: userMessages.REFRESH_TOKEN_EXPIRED,
        status: httpStatus.UNAUTHORIZED
      })
    }

    // 6️⃣ Lấy thông tin user từ database
    const user = (await UserModel.findById(decoded.user_id)) as User

    if (!user) {
      throw new ErrorWithStatus({
        message: userMessages.USER_NOT_FOUND,
        status: httpStatus.NOT_FOUND
      })
    }

    // 7️⃣ Kiểm tra user đã verify email chưa
    if (user.verify !== UserVerifyStatus.Verified) {
      throw new ErrorWithStatus({
        message: userMessages.USER_ACCOUNT_NOT_VERIFIED,
        status: httpStatus.ACCESS_DENIED
      })
    }

    // 8️⃣ Tạo Access Token mới
    const newAccessToken = await this.signAccessToken({
      user_id: user._id!.toString(),
      verify: UserVerifyStatus.Verified
    })

    // 9️⃣ (Optional) Tạo Refresh Token mới và xóa token cũ
    // Cách này an toàn hơn, mỗi lần refresh sẽ có token mới
    const newRefreshToken = await this.signRefreshToken({
      user_id: user._id!.toString(),
      verify: UserVerifyStatus.Verified
    })

    // Decode để lấy expiration time
    const decodedNewToken = jwt.decode(newRefreshToken) as jwt.JwtPayload | null

    // Xóa refresh token cũ
    await RefreshTokenModel.deleteOne({ _id: storedToken._id })

    // Lưu refresh token mới
    await RefreshTokenModel.create({
      user_id: user._id,
      token: newRefreshToken,
      expiresAt: decodedNewToken?.exp ? new Date(decodedNewToken.exp * 1000) : undefined,
      isRevoked: false
    })

    // ✅ Test Case: Valid refresh token → Return new tokens
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.verify,
        avatar: user.avatar
      }
    }
  },
  async getMeProfile(user_id: string) {
    const user = await UserModel.findOne(
      { _id: new ObjectId(user_id) },
      // Tham số thứ 2 của Mongoose findOne là object projection
      {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    )
    return user
  }
}
