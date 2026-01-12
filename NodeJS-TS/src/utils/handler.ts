import { NextFunction, Request, RequestHandler, Response } from 'express-serve-static-core'

export const wrapAsync = <P>(fn: RequestHandler<P, any, any, any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
