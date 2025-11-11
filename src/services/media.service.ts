import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage } from '~/utils/files'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
config()
export const MediaService = {
  async uploadImage(req: Request) {
    const file = await handleUploadImage(req)
    const newName = getNameFromFullName(file.newFilename)
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
    await sharp(file.filepath).jpeg().toFile(newPath)
    fs.unlinkSync(file.filepath)
    return isProduction
      ? `${process.env.HOST}/uploads/${newName}.jpg`
      : `http://localhost:${process.env.PORT}/uploads/${newName}.jpg`
  }
}
