import { Router } from 'express'
import { bookmarkTweetController, unBookmarkTweetController } from '~/controllers/bookmark.controller'
import { validateTweetId } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handler'

const bookmarkRouter = Router()
/**
 * Description: Bookmark a tweet
 * Path: /bookmarks
 * Method: POST
 * Body: { tweet_id: string }
 */
bookmarkRouter.post('/', accessTokenValidator, verifyUserValidator, validateTweetId, wrapAsync(bookmarkTweetController))
/**
 * Description: Unbookmark a tweet
 * Path: /bookmarks/:tweet_id
 * Method: DELETE
 */
bookmarkRouter.delete(
  '/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  validateTweetId,
  wrapAsync(unBookmarkTweetController)
)
export default bookmarkRouter
