import { NextFunction, Request, Response } from 'express-serve-static-core'

export const wrapAsync = (fn: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
