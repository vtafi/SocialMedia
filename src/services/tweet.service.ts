import mongoose from 'mongoose'
import { tweetMessages } from '~/constants/messages'
import { TweetRequestBody } from '~/models/requests/tweet.requests'
import TweetModel from '~/models/tweet.model'

export const TweetService = {
  async createTweet(userId: string, tweetData: TweetRequestBody) {
    const newTweet = await TweetModel.create({
      type: tweetData.type,
      audience: tweetData.audience,
      content: tweetData.content,
      parent_id: tweetData.parent_id ? new mongoose.Types.ObjectId(tweetData.parent_id) : null,
      hashtags: tweetData.hashtags.map((id) => new mongoose.Types.ObjectId(id)),
      mentions: tweetData.mentions.map((id) => new mongoose.Types.ObjectId(id)),
      medias: tweetData.medias,
      user_id: new mongoose.Types.ObjectId(userId)
    })
    return {
      message: tweetMessages.TWEET_CREATED_SUCCESSFULLY,
      data: newTweet
    }
  }
}
