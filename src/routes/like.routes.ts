import { Router } from 'express'
import { likeTweetController, unLikeTweetController } from '~/controllers/like.controller'
import { validateTweetId } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handler'

const likeRouter = Router()
/**
 * Description: Like a tweet
 * Path: /likes
 * Method: POST
 * Body: { tweet_id: string }
 */
likeRouter.post('/', accessTokenValidator, verifyUserValidator, validateTweetId, wrapAsync(likeTweetController))
/**
 * Description: Unlike a tweet
 * Path: /likes/:tweet_id
 * Method: DELETE
 */
likeRouter.delete(
  '/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  validateTweetId,
  wrapAsync(unLikeTweetController)
)
export default likeRouter
