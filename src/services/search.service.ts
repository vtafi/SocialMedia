import { SearchQuery } from '~/models/requests/search.requests'
import TweetModel from '~/models/tweet.model'
const ObjectId = mongoose.Types.ObjectId
import mongoose from 'mongoose'
import { TweetAudience, TweetType } from '~/constants/enum'

const SearchService = {
  async search({ limit, page, content, user_id }: { limit: number; page: number; content: string; user_id: string }) {
    const user_id_object = new ObjectId(user_id)
    const result = await TweetModel.aggregate([
      // -------------------------------------------------------
      // GIAI ĐOẠN 1: TÌM KIẾM TEXT & LỌC QUYỀN (QUAN TRỌNG NHẤT)
      // -------------------------------------------------------
      {
        $match: {
          $text: {
            $search: content
          }
        }
      },
      // Lookup User để lấy thông tin audience (Circle, ID)
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
      // Lọc theo quyền xem (Logic đã fix đầy đủ)
      {
        $match: {
          $or: [
            // 1. Bài viết công khai
            {
              audience: TweetAudience.Everyone // 0
            },
            // 2. Bài viết Circle VÀ User nằm trong Circle
            {
              $and: [
                {
                  audience: TweetAudience.TweetCircle // 1
                },
                {
                  'user.twitter_circle': {
                    $in: [user_id_object]
                  }
                }
              ]
            },
            // 3. (FIX) Bài viết của CHÍNH MÌNH (Tác giả luôn xem được bài của mình)
            {
              'user._id': user_id_object
            }
          ]
        }
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 2: PHÂN TRANG (PAGINATION)
      // Đặt ở đây để cắt giảm dữ liệu TRƯỚC khi join các bảng nặng
      // -------------------------------------------------------
      {
        $skip: limit * (page - 1)
      },
      {
        $limit: limit
      },

      // -------------------------------------------------------
      // GIAI ĐOẠN 3: POPULATE DỮ LIỆU (CHỈ CHẠY CHO SỐ LƯỢNG ĐÃ LIMIT)
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

      // 2. Mentions (Tối ưu: Chỉ select field cần thiết để bảo mật & nhẹ)
      {
        $lookup: {
          from: 'users',
          let: { mentions_ids: '$mentions' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$mentions_ids'] } } },
            { $project: { name: 1, username: 1, email: 1, _id: 1 } } // Chỉ lấy thông tin public
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

      // 5. Tweet Children (Tối ưu: Chỉ lấy field 'type' để phân loại đếm)
      {
        $lookup: {
          from: 'tweets',
          let: { tweet_id: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$parent_id', '$$tweet_id'] } } }, { $project: { type: 1 } }],
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
                cond: { $eq: ['$$item.type', TweetType.ReTweet] } // type: 1
              }
            }
          },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.Comment] } // type: 2
              }
            }
          },
          quote_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', TweetType.QuoteTweet] } // type: 3
              }
            }
          }
        }
      },
      // Clean up: Ẩn các trường không cần thiết hoặc nhạy cảm
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
