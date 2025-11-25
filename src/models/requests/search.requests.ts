import { PaginationQuery } from './tweet.requests'

export interface SearchQuery extends PaginationQuery {
  content: string
}
