import { Router } from 'express'
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetDetailController
} from '~/controllers/tweet.controller'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  validateTweetId
} from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifyUserValidator } from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handler'

const tweetRouter = Router()

/**
 * Description: Create a new tweet
 * Path: /tweets
 * Method: POST
 * Body: { type: TweetType, audience: TweetAudience, content: string, parent_id: string | null, hashtags: string[], mentions: string[], medias: Media[] }
 */
tweetRouter.post('/', accessTokenValidator, verifyUserValidator, createTweetValidator, wrapAsync(createTweetController))

/**
 * Description: Get tweet detail
 * Path: /tweets/:tweet_id
 * Method: GET
 */
tweetRouter.get(
  '/:tweet_id',
  validateTweetId,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  audienceValidator,
  wrapAsync(getTweetDetailController)
)

/**
 * Description: Get tweet children
 * Path: /tweets/:tweet_id/children
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Query: { limit: number, page: number , tweet_type: TweetType}
 */
tweetRouter.get(
  '/:tweet_id/children',
  validateTweetId,
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  audienceValidator,
  wrapAsync(getTweetChildrenController)
)

/**
 * Description: Get new feeds
 * Path: /tweets
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Query: { limit: number, page: number }
 */
tweetRouter.get('/', paginationValidator, accessTokenValidator, verifyUserValidator, wrapAsync(getNewFeedsController))

export default tweetRouter
