import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType } from '~/constants/enum'
import httpStatus from '~/constants/httpStatus'
import { tweetMessages } from '~/constants/messages'
import { numberEnumToArray } from '~/utils/commons'
import { ErrorWithStatus } from '~/utils/error'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        custom: {
          options: (value) => {
            const numValue = Number(value)
            if (isNaN(numValue) || !tweetTypes.includes(numValue)) {
              throw new Error(tweetMessages.INVALID_TYPE)
            }
            return true
          }
        }
      },
      audience: {
        custom: {
          options: (value) => {
            const numValue = Number(value)
            if (isNaN(numValue) || !tweetAudience.includes(numValue)) {
              throw new Error(tweetMessages.INVALID_AUDIENCE)
            }
            return true
          }
        }
      },
      content: {
        isString: true,
        custom: {
          options: (value, { req }) => {
            const type = Number(req.body.type) as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]

            // Tweet/Comment/QuoteTweet phải có content HOẶC hashtags HOẶC mentions
            if ([TweetType.Comment, TweetType.Tweet, TweetType.QuoteTweet].includes(type)) {
              if (isEmpty(hashtags) && isEmpty(mentions) && (!value || value.trim() === '')) {
                throw new Error(tweetMessages.CONTENT_MUST_BE_NOT_EMPTY)
              }
            }

            // ReTweet phải có content rỗng
            if (type === TweetType.ReTweet && value !== '') {
              throw new Error(tweetMessages.CONTENT_MUST_BE_EMPTY)
            }

            return true
          }
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = Number(req.body.type) as TweetType

            // Tweet thường phải có parent_id = null
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(tweetMessages.PARENT_ID_MUST_BE_NULL)
            }

            // ReTweet, Comment, QuoteTweet phải có parent_id hợp lệ
            if ([TweetType.ReTweet, TweetType.Comment, TweetType.QuoteTweet].includes(type)) {
              if (!value || !ObjectId.isValid(value)) {
                throw new Error(tweetMessages.PARENT_ID_MUST_BE_VALID_OBJECT_ID)
              }
            }

            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            if (value.some((item: any) => typeof item !== 'string')) {
              throw new ErrorWithStatus({
                message: tweetMessages.HASHTAGS_MUST_BE_ARRAY_OF_STRINGS,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            if (value.some((item: any) => !ObjectId.isValid(item))) {
              throw new ErrorWithStatus({
                message: tweetMessages.MENTIONS_MUST_BE_ARRAY_OF_OBJECT_IDS,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            if (
              value.some((item: any) => {
                return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
              })
            ) {
              throw new ErrorWithStatus({
                message: tweetMessages.MEDIAS_MUST_BE_ARRAY_OF_OBJECTS,
                status: httpStatus.UNPROCESSABLE_ENTITY
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
