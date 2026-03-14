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
  async getNewFeeds(user_id: string | undefined, limit: number, page: number) {
    let ids: any[] = []
    // Tạo ObjectId an toàn: Nếu có user_id thì tạo, không thì null
    const user_id_object = user_id ? new ObjectId(user_id) : null

    // -------------------------------------------------------
    // GIAI ĐOẠN 1: CHUẨN BỊ DANH SÁCH TÁC GIẢ (Chỉ dành cho User đã login)
    // -------------------------------------------------------
    if (user_id_object) {
      // 1. Lấy danh sách ID những người mình đã follow
      const followed_user_ids = await FollowersModel.find({ user_id: user_id_object }, { followed_user_id: 1, _id: 0 })

      ids = followed_user_ids.map((item) => item.followed_user_id)

      // [QUAN TRỌNG] Thêm ID của chính mình vào danh sách để thấy bài của mình trên Newsfeed
      // Sử dụng 'as any' để tránh lỗi TypeScript xung đột kiểu ObjectId của Mongoose và MongoDB
      ids.push(user_id_object as any)
    }

    // -------------------------------------------------------
    // GIAI ĐOẠN 2: THIẾT LẬP PIPELINE (User vs Guest)
    // -------------------------------------------------------

    // A. Lọc theo Tác giả
    // - Nếu là User: Chỉ xem bài của list `ids` (Follow + Bản thân)
    // - Nếu là Guest: `ids` rỗng -> Xem bài toàn hệ thống (hoặc bạn có thể custom logic khác)
    const matchAuthorStage = user_id_object ? { user_id: { $in: ids } } : {} // Guest: Không lọc tác giả

    // B. Lọc theo Quyền xem (Audience)
    const matchAudienceStage = user_id_object
      ? {
          $or: [
            // User xem được bài công khai
            { audience: TweetAudience.Everyone },
            // User xem được bài Circle nếu thỏa mãn điều kiện
            {
              $and: [
                { audience: TweetAudience.TweetCircle },
                {
                  $or: [
                    // Người xem nằm trong circle của tác giả
                    { 'user.twitter_circle': { $in: [user_id_object] } },
                    // Hoặc người xem CHÍNH LÀ tác giả
                    { 'user._id': user_id_object }
                  ]
                }
              ]
            }
          ]
        }
      : { audience: TweetAudience.Everyone } // Guest: CHỈ xem được bài công khai

    // GIAI ĐOẠN 3: AGGREGATION PIPELINE
    // -------------------------------------------------------
    const [result] = await TweetModel.aggregate([
      // 1. Lọc tác giả
      { $match: matchAuthorStage },
      // 2. Lookup User để lấy thông tin check quyền Circle
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user' } },
      // 3. Lọc quyền xem (Audience)
      { $match: matchAudienceStage },
      // 4. Sắp xếp: Mới nhất lên đầu
      { $sort: { created_at: -1 } },

      // 5. Facet: Chia luồng lấy Data và đếm Total
      {
        $facet: {
          tweets: [
            { $skip: limit * (page - 1) },
            { $limit: limit },

            // --- POPULATE START ---
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
                let: { mentions_ids: '$mentions' },
                pipeline: [
                  { $match: { $expr: { $in: ['$_id', '$$mentions_ids'] } } },
                  { $project: { name: 1, username: 1, email: 1, _id: 1 } }
                ],
                as: 'mentions'
              }
            },
            {
              $lookup: {
                from: 'bookmarks',
                let: { tweet_id: '$_id' },
                pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1, user_id: 1 } }],
                as: 'bookmarks'
              }
            },
            {
              $lookup: {
                from: 'likes',
                let: { tweet_id: '$_id' },
                pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1, user_id: 1 } }],
                as: 'likes'
              }
            },
            {
              $lookup: {
                from: 'tweets',
                let: { tweet_id: '$_id' },
                pipeline: [{ $match: { $expr: { $eq: ['$parent_id', '$$tweet_id'] } } }, { $project: { type: 1 } }],
                as: 'tweet_children'
              }
            },
            // --- POPULATE END ---

            {
              $addFields: {
                // Tính is_liked/is_bookmarked TRƯỚC khi ghi đè bằng $size
                is_liked: user_id_object ? { $in: [user_id_object, '$likes.user_id'] } : false,
                is_bookmarked: user_id_object ? { $in: [user_id_object, '$bookmarks.user_id'] } : false,
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
                  $add: ['$user_views', '$guest_views', 1]
                }
              }
            },
            {
              $project: {
                tweet_children: 0,
                user: {
                  password: 0,
                  email_verify_token: 0,
                  forgot_password_token: 0,
                  twitter_circle: 0,
                  date_of_birth: 0
                }
              }
            }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ])

    // GIAI ĐOẠN 4: XỬ LÝ KẾT QUẢ & VIEW
    // -------------------------------------------------------
    const tweets = result.tweets || []
    const total = result.total[0]?.count || 0

    // Tăng View (Chạy ngầm - Fire and Forget)
    if (tweets.length > 0) {
      const tweet_ids = tweets.map((tweet: any) => tweet._id)

      // Nếu có user_id -> Tăng user_views, Ngược lại -> Tăng guest_views
      const incField = user_id_object ? { user_views: 1 } : { guest_views: 1 }

      TweetModel.updateMany(
        { _id: { $in: tweet_ids } },
        {
          $inc: incField
          // $set: { updated_at: new Date() } // <-- TUYỆT ĐỐI KHÔNG BỎ COMMENT DÒNG NÀY
        }
      ).catch((err) => console.log('Update views error:', err))
    }

    return {
      tweets,
      total
    }
  }
}
