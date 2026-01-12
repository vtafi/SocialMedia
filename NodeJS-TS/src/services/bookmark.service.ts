import mongoose from 'mongoose'
import httpStatus from '~/constants/httpStatus'
import { bookmarkMessages } from '~/constants/messages'
import BookmarkModel from '~/models/bookmark.model'
import { ErrorWithStatus } from '~/utils/error'

export const BookmarkService = {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const result = await BookmarkModel.findOneAndUpdate(
      {
        user_id: new mongoose.Types.ObjectId(user_id),
        tweet_id: new mongoose.Types.ObjectId(tweet_id)
      },
      {
        $setOnInsert: {
          user_id: new mongoose.Types.ObjectId(user_id),
          tweet_id: new mongoose.Types.ObjectId(tweet_id)
        }
      },
      {
        upsert: true,
        new: true
      }
    )
    return {
      message: bookmarkMessages.BOOKMARK_CREATED_SUCCESSFULLY,
      result: {
        _id: result._id,
        user_id: result.user_id,
        tweet_id: result.tweet_id
      }
    }
  },
  async unBookmarkTweet(user_id: string, tweet_id: string) {
    const result = await BookmarkModel.findOneAndDelete({
      user_id: new mongoose.Types.ObjectId(user_id),
      tweet_id: new mongoose.Types.ObjectId(tweet_id)
    })
    if (!result) {
      throw new ErrorWithStatus({
        message: bookmarkMessages.BOOKMARK_NOT_FOUND,
        status: httpStatus.NOT_FOUND
      })
    }
    return {
      message: bookmarkMessages.BOOKMARK_DELETED_SUCCESSFULLY,
      result: result
    }
  }
}
