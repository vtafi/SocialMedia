import mongoose from 'mongoose'

import { tweetMessages } from '~/constants/messages'
import HashtagModel from '~/models/hashtag.model'
import { TweetRequestBody } from '~/models/requests/tweet.requests'
import { Tweet } from '~/models/schemas/tweet.schema'
import TweetModel from '~/models/tweet.model'

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
  async getTweetById(tweetId: string): Promise<Tweet | null> {
    const [tweet] = await TweetModel.aggregate<Tweet>([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(tweetId)
        }
      },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions'
        }
      },
      {
        $addFields: {
          mentions: {
            $map: {
              input: '$mentions',
              as: 'mention',
              in: {
                _id: '$$mention._id',
                name: '$$mention.name',
                username: '$$mention.username',
                email: '$$mention.email'
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes'
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'tweet_children'
        }
      },
      {
        $addFields: {
          bookmarks: {
            $size: '$bookmarks'
          },
          likes: {
            $size: '$likes'
          },
          retweet_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', 1]
                }
              }
            }
          },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', 2]
                }
              }
            }
          },
          quote_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: {
                  $eq: ['$$item.type', 3]
                }
              }
            }
          },
          views: {
            $add: ['$user_views', '$guest_views']
          }
        }
      },
      {
        $project: {
          tweet_children: 0
        }
      }
    ])
    return tweet || null
  },
  async increaseView(tweetId: string, userId?: string | null) {
    const inc = userId ? { user_views: 1 } : { guest_views: 1 }
    const tweet = await TweetModel.findByIdAndUpdate(
      tweetId,
      { $inc: inc, $currentDate: { updated_at: true } },
      { new: true, returnDocument: 'after', projection: { guest_views: 1, user_views: 1 } }
    )
    return tweet as {
      guest_views: number
      user_views: number
    }
  }
}
