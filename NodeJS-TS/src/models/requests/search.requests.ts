import { MediaTypeQuery } from '~/constants/enum'
import { PaginationQuery } from './tweet.requests'

export interface SearchQuery extends PaginationQuery {
  content: string
  media_type: MediaTypeQuery
}
