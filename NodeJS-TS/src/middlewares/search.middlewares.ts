import { checkSchema } from 'express-validator'
import { MediaTypeQuery } from '~/constants/enum'
import { searchMessages } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: searchMessages.CONTENT_MUST_BE_STRING
        },
        notEmpty: {
          errorMessage: searchMessages.CONTENT_REQUIRED
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)],
          errorMessage: searchMessages.MEDIA_TYPE_INVALID
        }
      }
    },
    ['query']
  )
)
