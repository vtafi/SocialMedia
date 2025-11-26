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
    // GIAI ĐOẠN 1: TÌM KIẾM TEXT & LỌC QUYỀN (GIỮ NGUYÊN)
    // -------------------------------------------------------
    {
      $match: {
        $text: { $search: content }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        pipeline: [{ $project: { twitter_circle: 1 } }],
        as: 'author_permissions'
      }
    },
    {
      $unwind: {
        path: '$author_permissions',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $match: {
        $or: [
          { audience: TweetAudience.Everyone },
          { user_id: user_id_object },
          {
            $and: [
              { audience: TweetAudience.TweetCircle },
              { 'author_permissions.twitter_circle': { $in: [user_id_object] } }
            ]
          }
        ]
      }
    },

    // -------------------------------------------------------
    // GIAI ĐOẠN 2: TÁCH LUỒNG DỮ LIỆU BẰNG $FACET (QUAN TRỌNG)
    // -------------------------------------------------------
    {
      $facet: {
        // Luồng 1: Lấy dữ liệu (Tweets) - Có Limit & Lookup nặng
        tweets: [
          { $skip: limit * (page - 1) },
          { $limit: limit }, // Cắt dữ liệu

          // Bắt đầu Lookup chi tiết (User, Likes, Bookmarks...)
          // Copy y nguyên phần lookup từ code cũ của bạn vào đây
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1, username: 1, avatar: 1, email: 1 } }],
              as: 'user'
            }
          },
          { $unwind: { path: '$user' } },
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
              pipeline: [{ $project: { type: 1 } }],
              as: 'tweet_children'
            }
          },
          // Format Output
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
                tweet_children: 0,
                author_permissions: 0
            }
          }
        ],

        // Luồng 2: Đếm tổng số lượng (Total) - Không Limit
        total: [
          { $count: 'count' } // Đếm số record lọt qua bước Match
        ]
      }
    }
  ])

  // -------------------------------------------------------
  // GIAI ĐOẠN 3: XỬ LÝ KẾT QUẢ & TĂNG VIEW
  // -------------------------------------------------------
  
  // $facet trả về mảng 1 phần tử: [{ tweets: [], total: [{ count: 100 }] }]
  const tweets = result[0].tweets
  const total = result[0].total[0]?.count || 0 // Nếu không tìm thấy gì thì total = 0

  // Logic tăng view (Side Effect)
  const tweetIds = tweets.map((tweet: any) => tweet._id)
  
  if (tweetIds.length > 0) {
    await TweetModel.updateMany(
      { _id: { $in: tweetIds } },
      { $inc: { user_views: 1 } }
    )

    // Cập nhật lại view trong RAM để trả về
    tweets.forEach((tweet: any) => {
      tweet.user_views = (tweet.user_views || 0) + 1
    })
  }

  // Trả về đúng format để Controller tính toán
  return {
    tweets,
    total
  }
}
}
export default SearchService
