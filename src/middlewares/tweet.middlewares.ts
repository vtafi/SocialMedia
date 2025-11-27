import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import httpStatus from '~/constants/httpStatus'
import { tweetMessages, userMessages } from '~/constants/messages'
import { Tweet } from '~/models/schemas/tweet.schema'
import TweetModel from '~/models/tweet.model'
import UserModel from '~/models/user.model'
import { TweetService } from '~/services/tweet.service'
import { numberEnumToArray } from '~/utils/commons'
import { ErrorWithStatus } from '~/utils/error'
import { wrapAsync } from '~/utils/handler'
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
export const validateTweetId = validate(
  checkSchema(
    {
      tweet_id: {
        isString: true,
        isMongoId: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: tweetMessages.TWEET_ID_MUST_BE_VALID_OBJECT_ID,
                status: httpStatus.BAD_REQUEST
              })
            }
            const tweet = await TweetService.getTweetById(value)
            if (!tweet) {
              throw new ErrorWithStatus({
                message: tweetMessages.TWEET_NOT_FOUND,
                status: httpStatus.NOT_FOUND
              })
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)
export const audienceValidator = wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TweetCircle) {
    // Kiểm tra người xem tw đã đăng nhập chưa
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status: httpStatus.UNAUTHORIZED,
        message: userMessages.ACCESS_TOKEN_IS_REQUIRED
      })
    }
    // Kiểm tra tài khoản bị khóa chưa
    const author = await UserModel.findById(tweet.user_id)
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: userMessages.USER_NOT_FOUND
      })
    }
    // Kiểm tra người xem tweet này có trong tweet circle của tác giả không
    const { user_id } = req.decoded_authorization
    const isInTweetCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.toString() === user_id)
    // Chỉ throw error nếu user KHÔNG trong circle VÀ user KHÔNG phải author
    if (!isInTweetCircle && author._id?.toString() !== user_id) {
      throw new ErrorWithStatus({
        status: httpStatus.FORBIDDEN,
        message: tweetMessages.TWEET_IS_NOT_PUBLIC
      })
    }
  }
  next()
})
export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: tweetMessages.INVALID_TWEET_TYPE
        }
      },
      limit: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const num = Number(value)
            if (num > 100) {
              throw new ErrorWithStatus({
                message: tweetMessages.MAX_LIMIT_IS_100,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            if (num < 1) {
              throw new ErrorWithStatus({
                message: tweetMessages.MIN_LIMIT_IS_1,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const num = Number(value)
            if (num < 1) {
              throw new ErrorWithStatus({
                message: tweetMessages.MIN_PAGE_IS_1,
                status: httpStatus.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)

export const paginationValidator = validate(
  checkSchema({
    limit: {
      isNumeric: true,
      custom: {
        options: (value, { req }) => {
          const num = Number(value)
          if (num > 100) {
            throw new ErrorWithStatus({
              message: tweetMessages.MAX_LIMIT_IS_100,
              status: httpStatus.UNPROCESSABLE_ENTITY
            })
          }
          if (num < 1) {
            throw new ErrorWithStatus({
              message: tweetMessages.MIN_LIMIT_IS_1,
              status: httpStatus.UNPROCESSABLE_ENTITY
            })
          }
          return true
        }
      }
    },
    page: {
      isNumeric: true,
      custom: {
        options: (value, { req }) => {
          const num = Number(value)
          if (num < 1) {
            throw new ErrorWithStatus({
              message: tweetMessages.MIN_PAGE_IS_1,
              status: httpStatus.UNPROCESSABLE_ENTITY
            })
          }
          return true
        }
      }
    }
  })
)
