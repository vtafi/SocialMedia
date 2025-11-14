import { Router } from 'express'
import { createTweetController } from '~/controllers/tweet.controller'
import { createTweetValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handler'

const tweetRouter = Router()

/**
 * Description: Create a new tweet
 * Path: /tweets
 * Method: POST
 * Body: { type: TweetType, audience: TweetAudience, content: string, parent_id: string | null, hashtags: string[], mentions: string[], medias: Media[] }
 */
tweetRouter.post('/', accessTokenValidator, verifyUserValidator, createTweetValidator, wrapAsync(createTweetController))

export default tweetRouter
