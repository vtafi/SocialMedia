import mongoose from 'mongoose'
import { tweetSchema } from './schemas/tweet.schema'

const TweetModel = mongoose.model('Tweets', tweetSchema)
export default TweetModel
