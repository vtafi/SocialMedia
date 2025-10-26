import { config } from 'dotenv'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { userMessages } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/users.requests'
import { ErrorWithStatus } from './errors'
import httpStatus from '~/constants/httpStatus'

config()
export const signToken = ({
  payload,
  privateKey,
  options // 1. Nhận options (có thể là undefined)
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: jwt.SignOptions
}) => {
  // 2. Tạo options cuối cùng, gộp (merge) giá trị mặc định
  //    với giá trị được truyền vào.
  const finalOptions: jwt.SignOptions = {
    algorithm: 'HS256', // Mặc định của bạn
    ...options // Ghi đè/thêm bằng options người dùng cung cấp
  }

  return new Promise<string>((resolve, reject) => {
    // 3. Dùng finalOptions
    jwt.sign(payload, privateKey, finalOptions, (err, token) => {
      if (err) {
        const error = new ErrorWithStatus({
          message: 'Failed to sign token.', // Thông báo chung chung
          status: httpStatus.INTERNAL_SERVER_ERROR // 500
        })
        // 4. Gợi ý 1: Trả về lỗi gốc
        return reject(error)
      }

      // 5. Kiểm tra kỹ token có tồn tại không trước khi resolve
      if (!token) {
        const error = new ErrorWithStatus({
          message: 'Token signing failed, token is empty.', // Thông báo của bạn
          status: httpStatus.INTERNAL_SERVER_ERROR // 500
        })
        return reject(error)
      }

      // 6. Resolve token
      resolve(token)
    })
  })
}

export const verifyToken = ({ token, publicKey }: { token: string; publicKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, publicKey, (err, decoded) => {
      if (err) {
        reject(new Error(userMessages.TOKEN_VERIFICATION_FAILED))
      } else {
        resolve(decoded as TokenPayload)
      }
    })
  })
}
