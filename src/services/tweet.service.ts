import mongoose, { ObjectId } from 'mongoose'
import httpStatus from '~/constants/httpStatus'
import { tweetMessages } from '~/constants/messages'
import HashtagModel from '~/models/hashtag.model'
import { TweetRequestBody } from '~/models/requests/tweet.requests'
import TweetModel from '~/models/tweet.model'
import { ErrorWithStatus } from '~/utils/error'

export const TweetService = {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map(async (hashtag) => {
        return await HashtagModel.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: { name: hashtag, _id: new mongoose.Types.ObjectId() } },
          { upsert: true, new: true }
        )
      })
    )
    return hashtagDocuments.map((hashtag) => hashtag._id)
  },
  async createTweet(userId: string, tweetData: TweetRequestBody) {
    const hashtag = await this.checkAndCreateHashtag(tweetData.hashtags)
    const newTweet = await TweetModel.create({
      type: tweetData.type,
      audience: tweetData.audience,
      content: tweetData.content,
      parent_id: tweetData.parent_id ? new mongoose.Types.ObjectId(tweetData.parent_id) : null,
      hashtags: hashtag,
      mentions: tweetData.mentions.map((id) => new mongoose.Types.ObjectId(id)),
      medias: tweetData.medias,
      user_id: new mongoose.Types.ObjectId(userId)
    })
    return {
      message: tweetMessages.TWEET_CREATED_SUCCESSFULLY,
      data: newTweet
    }
  },
  async getTweetDetail(tweetId: string) {
    const tweet = await TweetModel.findById(tweetId)
    if (!tweet) {
      throw new ErrorWithStatus({
        message: tweetMessages.TWEET_NOT_FOUND,
        status: httpStatus.NOT_FOUND
      })
    }
    return tweet
  }
}
