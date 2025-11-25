import { Request, Response, NextFunction } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { userMessages } from '~/constants/messages'
import UserModel from '~/models/user.model'
import { UserService } from '~/services/user.service'
import { validate } from '~/utils/validation'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { ErrorWithStatus } from '~/utils/error'
import httpStatus from '~/constants/httpStatus'
import RefreshTokenModel from '~/models/refreshToken.model'
import { JsonWebTokenError } from 'jsonwebtoken'
import { UserVerifyStatus } from '~/constants/enum'
import { TokenPayload } from '~/models/requests/user.requests'
import mongoose from 'mongoose'
import { REGEX_USERNAME } from '~/constants/regex'

const { ObjectId } = mongoose.Types
const passwordSchema: ParamSchema = {
  notEmpty: true,
  isString: true,
  isLength: {
    options: { min: 6, max: 100 },
    errorMessage: userMessages.PASSWORD_LIMIT
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: true,
  isString: true,
  isLength: {
    options: { min: 6, max: 100 },
    errorMessage: userMessages.PASSWORD_LIMIT
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(userMessages.PASSWORD_MISMATCH)
      }
      return true
    }
  }
}
const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      // Kiểm tra empty ngay trong custom
      if (!value) {
        throw new ErrorWithStatus({
          message: userMessages.FORGOT_PASSWORD_TOKEN_REQUIRED,
          status: httpStatus.UNAUTHORIZED // 401
        })
      }

      // Kiểm tra type
      if (typeof value !== 'string') {
        throw new ErrorWithStatus({
          message: userMessages.FORGOT_PASSWORD_TOKEN_STRING_REQUIRED,
          status: httpStatus.UNAUTHORIZED // 401
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          publicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        const { user_id } = decoded_forgot_password_token
        const user = await UserModel.findById(user_id)
        if (user === null) {
          throw new ErrorWithStatus({
            message: userMessages.TOKEN_INVALID_OR_EXPIRED,
            status: httpStatus.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: userMessages.FORGOT_PASSWORD_TOKEN_INVALID,
            status: httpStatus.UNAUTHORIZED
          })
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token
        return true
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: error.message,
            status: httpStatus.UNAUTHORIZED
          })
        }
        throw new ErrorWithStatus({
          message: userMessages.TOKEN_INVALID_OR_EXPIRED,
          status: httpStatus.UNAUTHORIZED
        })
      }
    }
  }
}
const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: userMessages.NAME_REQUIRED
  },
  isString: {
    errorMessage: userMessages.NAME_MUST_BE_STRING
  },
  trim: true
}
const dobSchema: ParamSchema = {
  isISO8601: {
    options: { strict: true, strictSeparator: true },
    errorMessage: userMessages.DATE_OF_BIRTH_INVALID
  },
  notEmpty: { errorMessage: userMessages.DATE_OF_BIRTH_REQUIRED }
}

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: userMessages.EMAIL_REQUIRED
        },

        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await UserModel.findOne({ email: value, password: hashPassword(req.body.password) }).exec()
            if (user === null) {
              throw userMessages.EMAIL_OR_PASSWORD_INCORRECT
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: userMessages.PASSWORD_REQUIRED
        },
        isString: {
          errorMessage: userMessages.PASSWORD_INCORRECT
        },
        isLength: {
          options: { min: 6, max: 50 },
          errorMessage: userMessages.PASSWORD_LIMIT
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        isEmail: true,
        notEmpty: true,
        trim: true,
        custom: {
          options: (value) => {
            return UserService.findByEmail(value).then((user) => {
              if (user) {
                throw userMessages.EMAIL_IN_USE
              }
              return true
            })
          }
        }
      },
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema,
      date_of_birth: dobSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        notEmpty: {
          errorMessage: userMessages.ACCESS_TOKEN_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_REQUIRED,
                status: httpStatus.UNAUTHORIZED // 401
              })
            }

            // Kiểm tra type
            if (typeof value !== 'string') {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_STRING_REQUIRED,
                status: httpStatus.UNAUTHORIZED // 401
              })
            }
            const accessToken = value.split(' ')[1]

            if (!accessToken) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: accessToken,
                publicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: userMessages.TOKEN_INVALID_OR_EXPIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value, { req }) => {
            // Kiểm tra empty ngay trong custom
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.REFRESH_TOKEN_REQUIRED,
                status: httpStatus.UNAUTHORIZED // 401
              })
            }

            // Kiểm tra type
            if (typeof value !== 'string') {
              throw new ErrorWithStatus({
                message: userMessages.REFRESH_STRING_REQUIRED,
                status: httpStatus.UNAUTHORIZED // 401
              })
            }
            try {
              const [decoded_refresh_token, refreshToken] = await Promise.all([
                verifyToken({ token: value, publicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                RefreshTokenModel.findOne({ token: value })
              ])
              if (refreshToken === null) {
                throw new ErrorWithStatus({
                  message: userMessages.TOKEN_VERIFICATION_FAILED,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              // Throw lại các error khác (như ErrorWithStatus)
              throw new ErrorWithStatus({
                message: userMessages.TOKEN_INVALID_OR_EXPIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        custom: {
          options: async (value, { req }) => {
            // Kiểm tra empty ngay trong custom
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.EMAIL_VERIFY_TOKEN_REQUIRED,
                status: httpStatus.UNAUTHORIZED // 401
              })
            }

            // Kiểm tra type
            if (typeof value !== 'string') {
              throw new ErrorWithStatus({
                message: userMessages.EMAIL_VERIFY_TOKEN_STRING_REQUIRED,
                status: httpStatus.UNAUTHORIZED // 401
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                publicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
              return true
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: httpStatus.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: userMessages.EMAIL_INVALID
        },
        notEmpty: true,
        trim: true,
        custom: {
          options: (value, { req }) => {
            return UserService.findByEmail(value).then((user) => {
              if (user === null) {
                throw userMessages.EMAIL_NOT_FOUND
              }
              req.user = user
              return true
            })
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema
    },
    ['body']
  )
)

export const verifyUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload

  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: userMessages.EMAIL_NOT_VERIFIED,
        status: httpStatus.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        trim: true
      },
      date_of_birth: { ...dobSchema, optional: true },
      bio: {
        optional: true,
        isString: {
          errorMessage: userMessages.BIO_STRING_REQUIRED
        },
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: userMessages.BIO_LIMITED_LENGTH
        },
        trim: true
      },
      location: {
        optional: true,
        isString: {
          errorMessage: userMessages.LOCATION_STRING_REQUIRED
        },
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: userMessages.LOCATION_LIMITED_LENGTH
        },
        trim: true
      },
      website: {
        optional: true,
        isString: {
          errorMessage: userMessages.WEBSITE_STRING_REQUIRED
        },
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: userMessages.WEBSITE_LIMITED_LENGTH
        },
        trim: true
      },
      username: {
        optional: true,
        isString: {
          errorMessage: userMessages.USERNAME_STRING_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            if (!REGEX_USERNAME.test(value)) {
              throw new ErrorWithStatus({
                message: userMessages.USERNAME_INVALID,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            const user = await UserModel.findOne({ username: value })
            if (user !== null) {
              throw new ErrorWithStatus({
                message: userMessages.USERNAME_ALREADY_IN_USE,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        },
        trim: true
      },
      avatar: {
        optional: true,
        isString: {
          errorMessage: userMessages.AVATAR_URL_REQUIRED
        },
        isLength: {
          options: { min: 1, max: 400 },
          errorMessage: userMessages.AVATAR_URL_LIMITED_LENGTH
        },
        trim: true
      },
      cover_photo: {
        optional: true,
        isString: {
          errorMessage: userMessages.COVER_IMAGE_URL_REQUIRED
        },
        isLength: {
          options: { min: 1, max: 400 },
          errorMessage: userMessages.COVER_IMAGE_URL_LIMITED_LENGTH
        },
        trim: true
      }
    },
    ['body']
  )
)

export const followUserValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        // 1. Check có gửi lên không trước
        notEmpty: {
          errorMessage: userMessages.FOLLOWED_USER_ID_REQUIRED
        },
        // 2. Check có phải string không
        isString: {
          errorMessage: userMessages.FOLLOWED_USER_ID_MUST_BE_STRING
        },
        // 3. Check format ObjectId
        custom: {
          options: async (value, { req }) => {
            // Check format
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: userMessages.FOLLOWED_USER_ID_MUST_BE_VALID_OBJECT_ID,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }

            // 4. Check logic: Không được follow chính mình
            // (Giả sử bạn đã decode token và gắn user_id vào req.decoded_authorization)
            const { user_id } = req.decoded_authorization
            if (value === user_id) {
               throw new ErrorWithStatus({
                message: 'Cannot follow yourself', // Nên đưa vào file messages
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }

            // 5. Check logic: User được follow có tồn tại trong DB không
            const followedUser = await UserModel.findById(value)
            console.log(followedUser)
            if (!followedUser) {
              throw new ErrorWithStatus({
                message: userMessages.USER_NOT_FOUND,
                status: httpStatus.NOT_FOUND
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const unfollowUserValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        custom: {
          options: (value, { req }) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: userMessages.UNFOLLOWED_USER_ID_MUST_BE_VALID_OBJECT_ID,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        },
        notEmpty: {
          errorMessage: userMessages.UNFOLLOWED_USER_ID_REQUIRED
        },
        isString: {
          errorMessage: userMessages.UNFOLLOWED_USER_ID_MUST_BE_STRING
        }
      }
    },
    ['params']
  )
)

export const isUserLoggedInValidator = (validator: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return validator(req, res, next)
    }
    next()
  }
}
