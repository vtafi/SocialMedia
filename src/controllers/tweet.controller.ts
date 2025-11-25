import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enum'
import { tweetMessages } from '~/constants/messages'

import { PaginationQuery, TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/tweet.requests'
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
    views: result.guest_views + result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    result: tweet
  })
}

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const tweetType = Number(req.query.tweet_type) as TweetType
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id
  const { tweets, total } = await TweetService.getTweetChildren(req.params.tweet_id, tweetType, limit, page, user_id)
  return res.json({
    message: tweetMessages.TWEET_CHILDREN_FETCHED_SUCCESSFULLY,
    result: {
      tweets,
      tweetType,
      limit,
      page,
      total_pages: Math.ceil(total / limit)
    }
  })
}

export const getNewFeedsController = async (
  req: Request<ParamsDictionary, any, any, PaginationQuery>,
  res: Response
) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await TweetService.getNewFeeds(user_id, limit, page)
  return res.json({
    message: tweetMessages.TWEET_NEW_FEEDS_SUCCESSFULLY,
    result: {}
  })
}
