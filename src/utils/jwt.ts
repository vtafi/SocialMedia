import { config } from 'dotenv'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { userMessages } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/users.requests'

config()
export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        reject(new Error('Token signing failed'))
      } else {
        resolve(token as string)
      }
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
