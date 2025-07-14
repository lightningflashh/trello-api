import multer from 'multer'
import { LIMIT_COMMON_FILE_SIZE, ALLOW_COMMON_FILE_TYPES } from '~/utils/validators.js'
import { ApiError } from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const customFileFilter = (req, file, callback) => {
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.mimetype)) {
    return callback(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'File type is invalid. Only accept jpg, jpeg and png'), null)
  }
  callback(null, true) // Accept the file
}

// Khởi tạo function upload
const upload = multer({
  limits: {
    fileSize: LIMIT_COMMON_FILE_SIZE
  },
  fileFilter: customFileFilter
})

export const multerUploadMiddleware = { upload }