import TweetModel from '~/models/tweet.model'
import mongoose from 'mongoose'
import { TweetType } from '~/constants/enum'

const SearchService = {
  async search({
    limit,
    page,
    content,
    user_id
  }: {
    limit: number
    page: number
    content: string
    user_id?: string
  }): Promise<any[]> {
    const result = await TweetModel.aggregate([
      // -------------------------------------------------------
      // GIAI ĐOẠN 1: TÌM KIẾM TEXT & LỌC QUYỀN (Audience)
      // -------------------------------------------------------
      {
        $match: {
          $text: {
            $search: content
          }
        }
      },
      // Lookup User để check quyền xem (Bắt buộc phải làm ở đây)
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
              audience: 0 // Everyone
            },
            ...(user_id
              ? [
                  {
                    $and: [
                      {
                        audience: 1 // Twitter Circle
                      },
                      {
                        'user.twitter_circle': {
                          $in: [new mongoose.Types.ObjectId(user_id)]
                        }
                      }
                    ]
                  }
                ]
              : [])
          ]
        }
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 2: PHÂN TRANG (PAGINATION)
      // Di chuyển xuống ngay đây để giảm tải tính toán
      // -------------------------------------------------------

      // Thêm score từ textScore để sort
      {
        $addFields: {
          score: { $meta: 'textScore' }
        }
      },

      // Sort theo độ liên quan (textScore) và ngày tạo mới nhất
      {
        $sort: { score: -1, created_at: -1 }
      },

      {
        $skip: limit * (page - 1) // Vị trí cũ: limit * (page - 1)
      },
      {
        $limit: limit // Vị trí cũ: limit
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 3: POPULATE DỮ LIỆU (CHỈ CHẠY CHO 2 ITEMS ĐÃ LIMIT)
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

      // 2. Mentions (Tối ưu: Chỉ lấy name/username/email)
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

      // 3. Bookmarks (Tối ưu: Chỉ lấy _id để đếm size)
      {
        $lookup: {
          from: 'bookmarks',
          let: { tweet_id: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1 } }],
          as: 'bookmarks'
        }
      },

      // 4. Likes (Tối ưu: Chỉ lấy _id để đếm size)
      {
        $lookup: {
          from: 'likes',
          let: { tweet_id: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1 } }],
          as: 'likes'
        }
      },

      // 5. Tweet Children (Tối ưu: Chỉ lấy field 'type' để phân loại)
      {
        $lookup: {
          from: 'tweets',
          let: { tweet_id: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$parent_id', '$$tweet_id'] } } }, { $project: { type: 1 } }],
          as: 'tweet_children'
        }
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 4: FORMAT DỮ LIỆU
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
                cond: { $eq: ['$$item.type', TweetType.ReTweet] } // TweetType.ReTweet
              }
            }
          },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.Comment] } // TweetType.Comment
              }
            }
          },
          quote_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.QuoteTweet] } // TweetType.QuoteTweet
              }
            }
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
    ])
    return result
  }
}
export default SearchService
