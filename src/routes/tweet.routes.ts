import { Router } from 'express'
import { createTweetController, getTweetDetailController } from '~/controllers/tweet.controller'
import { audienceValidator, createTweetValidator, validateTweetId } from '~/middlewares/tweet.middlewares'
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

export default tweetRouter
