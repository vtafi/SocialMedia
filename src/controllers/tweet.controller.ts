import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { tweetMessages } from '~/constants/messages'

import { TweetRequestBody } from '~/models/requests/tweet.requests'
import { TokenPayload } from '~/models/requests/user.requests'
import { TweetService } from '~/services/tweet.service'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await TweetService.createTweet(user_id, req.body)
  return res.json({
    message: tweetMessages.TWEET_CREATED_SUCCESSFULLY,
    result: result.data
  })
}

export const getTweetDetailController = async (req: Request, res: Response) => {
  const result = await TweetService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  console.log(result)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    views: result.guest_views + result.user_views
  }
  return res.json({
    result: tweet
  })
}
