import mongoose from 'mongoose'
import { TweetAudience, TweetType } from '~/constants/enum'
import { tweetMessages } from '~/constants/messages'
import FollowersModel from '~/models/follower.model'
import HashtagModel from '~/models/hashtag.model'
import { TweetRequestBody } from '~/models/requests/tweet.requests'
import { Tweet } from '~/models/schemas/tweet.schema'
import TweetModel from '~/models/tweet.model'
const ObjectId = mongoose.Types.ObjectId
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

      // 1. Hashtags (Giữ nguyên vì số lượng ít)
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },

      // 2. Mentions (Tối ưu: Chỉ lấy name, username, email)
      {
        $lookup: {
          from: 'users',
          let: { mentions_ids: '$mentions' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$mentions_ids'] } } },
            { $project: { name: 1, username: 1, email: 1, _id: 1 } }
          ],
          as: 'mentions'
        }
      },

      // 3. Bookmarks (TỐI ƯU QUAN TRỌNG: Chỉ lấy _id để đếm)
      // Thay vì lấy full document bookmarks, ta chỉ lấy field _id.
      // Giúp giảm kích thước mảng trong RAM đi 90%.
      {
        $lookup: {
          from: 'bookmarks',
          let: { tweet_id: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1 } }],
          as: 'bookmarks'
        }
      },

      // 4. Likes (TỐI ƯU QUAN TRỌNG: Chỉ lấy _id để đếm)
      {
        $lookup: {
          from: 'likes',
          let: { tweet_id: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1 } }],
          as: 'likes'
        }
      },

      // 5. Tweet Children (TỐI ƯU QUAN TRỌNG: Chỉ lấy field 'type')
      // Ta chỉ cần field 'type' để phân loại (comment/quote/retweet).
      // Không cần lấy nội dung, hình ảnh của comment...
      {
        $lookup: {
          from: 'tweets',
          let: { tweet_id: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$parent_id', '$$tweet_id'] } } }, { $project: { type: 1 } }],
          as: 'tweet_children'
        }
      },

      // 6. Tính toán và Format (Logic giữ nguyên nhưng chạy trên dữ liệu siêu nhẹ)
      {
        $addFields: {
          bookmarks: { $size: '$bookmarks' },
          likes: { $size: '$likes' },
          retweet_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.ReTweet] }
              }
            }
          },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.Comment] }
              }
            }
          },
          quote_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
              }
            }
          },
          views: {
            $add: ['$user_views', '$guest_views'] // Cộng view
          }
        }
      },

      // 7. Clean up
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
      { new: true, returnDocument: 'after', projection: { guest_views: 1, user_views: 1, updated_at: 1 } }
    )
    return tweet as {
      guest_views: number
      user_views: number
      updated_at: Date
    }
  },
  async getTweetChildren(tweetId: string, tweetType: TweetType, limit: number, skip: number, user_id?: string) {
    const tweets = await TweetModel.aggregate<Tweet>([
      // -------------------------------------------------------
      // GIAI ĐOẠN 1: LỌC DỮ LIỆU
      // -------------------------------------------------------
      {
        $match: {
          parent_id: new ObjectId(tweetId),
          type: tweetType
        }
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 2: PHÂN TRANG & SẮP XẾP (QUAN TRỌNG NHẤT)
      // Xử lý ngay tại đây để giảm tải cho server
      // -------------------------------------------------------
      {
        $sort: {
          created_at: -1 // Mới nhất lên đầu (hoặc 1 nếu muốn cũ nhất lên đầu)
        }
      },
      {
        $skip: limit * (skip - 1) // Lưu ý: biến 'skip' của bạn nên đổi tên thành 'page' cho chuẩn nghĩa
      },
      {
        $limit: limit
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 3: LẤY THÔNG TIN CHI TIẾT (CHỈ CHẠY CHO CÁC ITEM ĐÃ LIMIT)
      // -------------------------------------------------------

      // 1. Hashtags
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },

      // 2. Mentions (Tối ưu: Select field ngay trong lookup)
      {
        $lookup: {
          from: 'users',
          let: { mentions_ids: '$mentions' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$mentions_ids'] }
              }
            },
            {
              $project: {
                name: 1,
                username: 1,
                email: 1,
                _id: 1
              }
            }
          ],
          as: 'mentions'
        }
      },

      // 3. Bookmarks (Đếm)
      {
        $lookup: {
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks'
        }
      },

      // 4. Likes (Đếm)
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes'
        }
      },

      // 5. Tweet Children (Đếm Retweet, Comment, Quote)
      {
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'tweet_children'
        }
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 4: FORMAT DỮ LIỆU ĐẦU RA
      // -------------------------------------------------------
      {
        $addFields: {
          bookmarks: { $size: '$bookmarks' },
          likes: { $size: '$likes' },
          retweet_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.ReTweet] }
              }
            }
          },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.Comment] }
              }
            }
          },
          quote_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
              }
            }
          }
        }
      },
      {
        $project: {
          tweet_children: 0, // Xóa mảng tweet con sau khi đã đếm xong
          bookmarks: 0, // Xóa mảng bookmarks (nếu chỉ cần count)
          likes: 0 // Xóa mảng likes (nếu chỉ cần count)
        }
      }
    ])
    const ids = tweets.map((tweet) => tweet._id)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }

    const [, total] = await Promise.all([
      TweetModel.updateMany({ _id: { $in: ids } }, { $inc: inc, $set: { updated_at: new Date() } }),
      TweetModel.countDocuments({
        parent_id: new mongoose.Types.ObjectId(tweetId),
        type: tweetType
      })
    ])
    tweets.forEach((tweet) => {
      tweet.updated_at = new Date()
      if (user_id) {
        tweet.user_views = tweet.user_views + 1
      } else {
        tweet.guest_views = tweet.guest_views + 1
      }
    })
    return {
      tweets,
      total
    }
  },
  async getNewFeeds(user_id: string, limit: number, page: number) {
    const user_id_object = new ObjectId(user_id)
    const followed_user_ids = await FollowersModel.find(
      { user_id: user_id_object },
      { followed_user_id: 1, _id: 0 } // Chỉ lấy field này, mặc định MongoDB sẽ TỰ ĐỘNG lấy thêm _id
    )
    const ids = followed_user_ids.map((followed_user_id) => followed_user_id.followed_user_id)
    const tweets = await TweetModel.aggregate([
      // -------------------------------------------------------
      // GIAI ĐOẠN 1: LỌC BÀI VIẾT CƠ BẢN & CHECK QUYỀN
      // -------------------------------------------------------
      {
        $match: {
          user_id: {
            $in: ids // List ID tác giả bài viết
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user'
        }
      },
      {
        $match: {
          $or: [
            {
              audience: TweetAudience.Everyone
            },
            {
              $and: [
                {
                  audience: TweetAudience.TweetCircle
                },
                {
                  'user.twitter_circle': {
                    $in: [user_id_object] // Check xem người xem có trong circle không
                  }
                }
              ]
            }
          ]
        }
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 2: SẮP XẾP VÀ PHÂN TRANG (TỐI ƯU HIỆU SUẤT TẠI ĐÂY)
      // Chỉ lấy ra đúng 10 bài cần thiết trước khi join dữ liệu nặng
      // -------------------------------------------------------
      {
        $sort: {
          created_at: -1 // Bài mới nhất lên đầu
        }
      },
      {
        $skip: limit * (page - 1)
      },
      {
        $limit: limit
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 3: POPULATE DỮ LIỆU LIÊN QUAN (LOOKUP)
      // Chỉ chạy cho số ít bài viết đã limit ở trên
      // -------------------------------------------------------

      // 1. Hashtags
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },

      // 2. Mentions (Tối ưu: Chỉ select fields cần thiết ngay trong lookup)
      {
        $lookup: {
          from: 'users',
          let: { mentions_ids: '$mentions' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$mentions_ids'] }
              }
            },
            {
              $project: {
                name: 1,
                username: 1,
                email: 1,
                _id: 1
              }
            }
          ],
          as: 'mentions'
        }
      },

      // 3. Bookmarks (Để đếm)
      {
        $lookup: {
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks'
        }
      },

      // 4. Likes (Để đếm)
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes'
        }
      },

      // 5. Children Tweets (Để đếm Retweet, Comment, Quote)
      {
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'tweet_children'
        }
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 4: TÍNH TOÁN (COUNT) VÀ FORMAT DỮ LIỆU ĐẦU RA
      // -------------------------------------------------------
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
                  $eq: ['$$item.type', TweetType.ReTweet]
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
                  $eq: ['$$item.type', TweetType.Comment]
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
                  $eq: ['$$item.type', TweetType.QuoteTweet]
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
          tweet_children: 0, // Bỏ mảng này đi cho nhẹ response
          user: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
            twitter_circle: 0,
            date_of_birth: 0
          }
        }
      }
    ])
    return tweets
  }
}
