import { Router } from 'express'
import { searchController } from '~/controllers/search.controller'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handler'

const searchRouter = Router()

/**
 * Description: Search for a user
 * Path: /search
 * Method: GET
 * Query: { query: string }
 */
searchRouter.get('/', accessTokenValidator, verifyUserValidator, wrapAsync(searchController))

export default searchRouter
