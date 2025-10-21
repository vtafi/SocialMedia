import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { userMessages } from '~/constants/messages'
import UserModel from '~/models/users.model'
import { UserService } from '~/services/users.services'
import { validate } from '~/utils/validation'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { ErrorWithStatus } from '~/utils/errors'
import httpStatus from '~/constants/httpStatus'
import RefreshTokenModel from '~/models/refreshToken.model'
import { JsonWebTokenError } from 'jsonwebtoken'

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
      name: {
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: userMessages.NAME_LIMIT
        },
        notEmpty: {
          errorMessage: userMessages.NAME_REQUIRED
        },
        trim: true,
        isString: true
      },
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
      password: {
        notEmpty: true,
        isString: true,
        isLength: {
          options: { min: 6, max: 100 },
          errorMessage: userMessages.PASSWORD_LIMIT
        }
      },
      confirmPassword: {
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
      },
      date_of_birth: {
        isISO8601: {
          options: { strict: true, strictSeparator: true },
          errorMessage: userMessages.DATE_OF_BIRTH_INVALID
        },
        notEmpty: { errorMessage: userMessages.DATE_OF_BIRTH_REQUIRED }
      }
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
            const accessToken = value.split(' ')[1]
            if (!accessToken) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({ token: accessToken })
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
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
                verifyToken({ token: value }),
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
            }
          }
        }
      }
    },
    ['body']
  )
)
