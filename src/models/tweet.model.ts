import mongoose from 'mongoose'
import { tweetSchema } from './schemas/Tweet.schema'

const TweetModel = mongoose.model('Tweets', tweetSchema)
export default TweetModel
