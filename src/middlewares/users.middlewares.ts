import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { userMessages } from '~/constants/messages'
import UserModel from '~/models/users.model'
import { UserService } from '~/services/users.services'
import { validate } from '~/utils/validation'
import { hashPassword } from '~/utils/crypto'

export const loginValidator = validate(
  checkSchema({
    email: {
      isEmail: {
        errorMessage: userMessages.EMAIL_REQUIRED
      },

      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await UserModel.findOne({ email: value, password: hashPassword(req.body.password) }).exec()
          if (user === null) {
            throw userMessages.USER_NOT_FOUND
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
  })
)

export const registerValidator = validate(
  checkSchema({
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
    },
    gender: {
      isIn: {
        options: [[0, 1, 2]],
        errorMessage: userMessages.GENDER_INVALID
      }
    },
    phone: {
      notEmpty: true,
      isString: true,
      matches: {
        options: [/^(0\d{9})$/], // Cung cấp regex trong mảng options
        errorMessage: userMessages.PHONE_INVALID
      }
    }
  })
)
