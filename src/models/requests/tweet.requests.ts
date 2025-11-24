import { TweetAudience, TweetType } from '~/constants/enum'
import { Media } from '../other'
import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: string | null
  hashtags: string[]
  mentions: string[]
  medias: Media[]
}

export interface TweetParam extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery extends PaginationQuery, Query {
  tweet_type: string
}
export interface PaginationQuery {
  limit: string
  page: string
}
