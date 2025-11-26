// search.controller.ts
import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { tweetMessages } from '~/constants/messages'
import { SearchQuery } from '~/models/requests/search.requests'
import SearchService from '~/services/search.service'

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  // 1. Thêm Default Value để tránh lỗi NaN nếu user không gửi query
  const limit = Number(req.query.limit) || 10
  const page = Number(req.query.page) || 1

  // 2. Gọi Service (Service sẽ trả về cấu trúc mới gồm tweets và total)
  const result = await SearchService.search({
    limit,
    page,
    content: req.query.content as string,
    user_id: req.decoded_authorization?.user_id as string
  })

  return res.json({
    message: tweetMessages.TWEET_SEARCH_SUCCESSFULLY,
    result: {
      tweets: result.tweets, // Data của trang hiện tại
      limit,
      page,
      // 3. Tính toán dựa trên tổng số bản ghi thực tế tìm thấy
      total_pages: Math.ceil(result.total / limit)
    }
  })
}
