import mongoose from 'mongoose'
import httpStatus from '~/constants/httpStatus'
import { likeMessages } from '~/constants/messages'
import LikeModel from '~/models/like.model'
import { ErrorWithStatus } from '~/utils/error'

export const LikeService = {
  async likeTweet(user_id: string, tweet_id: string) {
    const result = await LikeModel.findOneAndUpdate(
      { user_id: new mongoose.Types.ObjectId(user_id), tweet_id: new mongoose.Types.ObjectId(tweet_id) },
      {
        $setOnInsert: { user_id: new mongoose.Types.ObjectId(user_id), tweet_id: new mongoose.Types.ObjectId(tweet_id) }
      },
      { upsert: true, new: true }
    )
    if (!result) {
      throw new ErrorWithStatus({
        message: likeMessages.LIKE_NOT_FOUND,
        status: httpStatus.NOT_FOUND
      })
    }
    return {
      message: likeMessages.LIKE_CREATED_SUCCESSFULLY,
      result: {
        _id: result._id,
        user_id: result.user_id,
        tweet_id: result.tweet_id
      }
    }
  },
  async unlikeTweet(user_id: string, tweet_id: string) {
    const result = await LikeModel.findOneAndDelete({
      user_id: new mongoose.Types.ObjectId(user_id),
      tweet_id: new mongoose.Types.ObjectId(tweet_id)
    })
    if (!result) {
      throw new ErrorWithStatus({
        message: likeMessages.LIKE_NOT_FOUND,
        status: httpStatus.NOT_FOUND
      })
    }
    return {
      message: likeMessages.LIKE_DELETED_SUCCESSFULLY
    }
  }
}
