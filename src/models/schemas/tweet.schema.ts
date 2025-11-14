import { model, ObjectId, Schema } from 'mongoose'
import { TweetAudience, TweetType } from '~/constants/enum'
import { Media } from '../other'

interface Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: ObjectId | null
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
}

export const tweetSchema = new Schema<Tweet>({
  user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  type: { type: Number, enum: TweetType, default: TweetType.Tweet },
  audience: { type: Number, enum: TweetAudience, default: TweetAudience.Everyone },
  content: { type: String, default: '' },
  parent_id: { type: Schema.Types.ObjectId, ref: 'Tweets', default: null },
  hashtags: { type: [Schema.Types.ObjectId], ref: 'Hashtag', default: [] },
  mentions: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  medias: { type: Schema.Types.Mixed as any as Media[], default: [] },
  guest_views: { type: Number, default: 0 },
  user_views: { type: Number, default: 0 }
})
