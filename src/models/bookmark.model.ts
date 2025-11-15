import mongoose from 'mongoose'
import { bookmarkSchema } from './schemas/bookmark.schema'

const BookmarkModel = mongoose.model('Bookmarks', bookmarkSchema)
export default BookmarkModel
