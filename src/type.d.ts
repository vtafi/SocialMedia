import { Request } from 'express'
import { User } from './models/schemas/user.schema'
import { TokenType } from './constants/enum'
import { TokenPayload } from './models/requests/users.requests'

declare module 'express' {
  interface Request {
    user?: User
    decoded_authentication?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
  }
}
