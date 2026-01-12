import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BookmarkRequestBody } from '~/models/requests/bookmark.requests'
import { TokenPayload } from '~/models/requests/user.requests'
import { BookmarkService } from '~/services/bookmark.service'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkRequestBody>,
  res: Response
) => {
  const { tweet_id } = req.body
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await BookmarkService.bookmarkTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}
export const unBookmarkTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await BookmarkService.unBookmarkTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}
