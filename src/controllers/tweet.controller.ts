import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { tweetMessages } from '~/constants/messages'

import { TweetRequestBody } from '~/models/requests/tweet.requests'
import { TokenPayload } from '~/models/requests/user.requests'
import { TweetService } from '~/services/tweet.service'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  console.log(user_id)
  const result = await TweetService.createTweet(user_id, req.body)
  console.log(result)
  return res.json({
    message: tweetMessages.TWEET_CREATED_SUCCESSFULLY,
    result: result.data
  })
}
