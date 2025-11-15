import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LikeRequestBody } from '~/models/requests/like.requests'
import { TokenPayload } from '~/models/requests/user.requests'
import { LikeService } from '~/services/like.service'

export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeRequestBody>, res: Response) => {
  const { tweet_id } = req.body
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await LikeService.likeTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}

export const unLikeTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await LikeService.unlikeTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}
