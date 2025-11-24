export const userMessages = {
  EMAIL_IN_USE: 'Email is already in use',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_UPDATED_SUCCESSFULLY: 'User updated successfully',
  REGISTRATION_SUCCESSFUL: 'Registration successful',
  LOGIN_SUCCESSFUL: 'Login successful',
  VALIDATION_ERROR: 'Validation error',
  PASSWORD_MISMATCH: 'Passwords do not match',
  PASSWORD_LIMIT: 'Password must be at least 6 characters long and at most 100 characters long',
  DATE_OF_BIRTH_INVALID: 'Date of birth must be a valid date',
  DATE_OF_BIRTH_REQUIRED: 'Date of birth is required',
  NAME_LIMIT: 'Name must be at least 3 characters long and at most 50 characters long',
  NAME_REQUIRED: 'Name is required',
  GENDER_INVALID: 'Gender must be selected from the allowed values',
  PHONE_INVALID: 'Phone number must be a valid 10-digit number starting with 0',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  EMAIL_NOT_FOUND: 'Email not found in our records',
  PASSWORD_INCORRECT: 'The password you entered is incorrect',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',
  ACCESS_TOKEN_REQUIRED: 'Access token is required',
  TOKEN_VERIFICATION_FAILED: 'Refresh token verification failed',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  REFRESH_STRING_REQUIRED: 'Refresh string is required',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  TOKEN_INVALID_OR_EXPIRED: 'Token invalid or expired',
  EMAIL_VERIFY_TOKEN_REQUIRED: 'Email verify token is required',
  ACCESS_TOKEN_STRING_REQUIRED: 'Access token must be a string',
  EMAIL_VERIFY_TOKEN_STRING_REQUIRED: 'Email verify token must be a string',
  EMAIL_VERIFY_TOKEN_VERIFICATION_FAILED: 'Email verify token verification failed',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',
  EMAIL_VERIFIED_SUCCESSFULLY: 'Email verified successfully',
  RESEND_EMAIL_VERIFIED_SUCCESSFULLY: 'Resend email verified successfully',
  EMAIL_INVALID: 'Email is invalid',
  FORGOT_PASSWORD_EMAIL_SENT_SUCCESSFULLY: 'Forgot password email sent successfully',
  FORGOT_PASSWORD_TOKEN_REQUIRED: 'Forgot password token is required',
  FORGOT_PASSWORD_TOKEN_STRING_REQUIRED: 'Forgot password token must be a string',
  FORGOT_PASSWORD_TOKEN_VERIFIED_SUCCESSFULLY: 'Forgot password token verified successfully',
  FORGOT_PASSWORD_TOKEN_INVALID: 'Forgot password token is invalid',
  RESET_PASSWORD_SUCCESSFULLY: 'Reset password successfully',
  EMAIL_NOT_VERIFIED: 'Email not verified, please verify your email first',
  REGISTER_SUCCESSFUL: 'Register successful',
  REFRESH_TOKEN_INVALID: 'Refresh token is invalid',
  REFRESH_TOKEN_NOT_FOUND: 'Refresh token not found',
  REFRESH_TOKEN_REVOKED: 'Refresh token revoked',
  REFRESH_TOKEN_EXPIRED: 'Refresh token expired',
  USER_ACCOUNT_NOT_VERIFIED: 'User account not verified',
  GET_ME_SUCCESSFULLY: 'Get me successfully',
  UPDATE_ME_SUCCESSFULLY: 'Update me successfully',
  NAME_MUST_BE_STRING: 'Name must be a string',
  BIO_STRING_REQUIRED: 'Bio must be a string',
  BIO_LIMITED_LENGTH: 'Bio must be at least 1 character long and at most 100 characters long',
  LOCATION_STRING_REQUIRED: 'Location must be a string',
  LOCATION_LIMITED_LENGTH: 'Location must be at least 1 character long and at most 100 characters long',
  WEBSITE_STRING_REQUIRED: 'Website must be a string',
  WEBSITE_LIMITED_LENGTH: 'Website must be at least 1 character long and at most 100 characters long',
  USERNAME_STRING_REQUIRED: 'Username must be a string',
  USERNAME_LIMITED_LENGTH: 'Username must be at least 1 character long and at most 100 characters long',
  AVATAR_URL_REQUIRED: 'Avatar URL is required',
  AVATAR_URL_LIMITED_LENGTH: 'Avatar URL must be at least 1 character long and at most 400 characters long',
  COVER_IMAGE_URL_REQUIRED: 'Cover image URL is required',
  COVER_IMAGE_URL_LIMITED_LENGTH: 'Cover image URL must be at least 1 character long and at most 400 characters long',
  FOLLOW_USER_SUCCESSFULLY: 'Follow user successfully',
  FOLLOWED_USER_ID_REQUIRED: 'Followed user ID is required',
  FOLLOWED_USER_ID_MUST_BE_STRING: 'Followed user ID must be a string',
  FOLLOWED_USER_ID_MUST_BE_VALID_OBJECT_ID: 'Followed user ID must be a valid ObjectId',
  USER_TO_FOLLOW_NOT_FOUND: 'User to follow not found',
  ALREADY_FOLLOWING_THIS_USER: 'Already following this user',
  FOLLOWED_SUCCESSFULLY: 'Followed successfully',
  UNFOLLOWED_USER_ID_REQUIRED: 'Unfollowed user ID is required',
  UNFOLLOWED_USER_ID_MUST_BE_STRING: 'Unfollowed user ID must be a string',
  UNFOLLOWED_USER_ID_MUST_BE_VALID_OBJECT_ID: 'Unfollowed user ID must be a valid ObjectId',
  UNFOLLOWED_SUCCESSFULLY: 'Unfollowed successfully',
  USER_NOT_FOLLOWING_THIS_USER: 'User not following this user',
  USERNAME_INVALID:
    'Username must be at least 4 characters long and at most 15 characters long and contain only letters, numbers, and underscores',
  USERNAME_ALREADY_IN_USE: 'Username already in use',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  USER_IS_BANNED: 'User is banned'
} as const

export const fileMessages = {
  FILE_TYPE_NOT_VALID: 'File type is not valid',
  FILE_SIZE_TOO_LARGE: 'File size is too large',
  FILE_SIZE_TOO_SMALL: 'File size is too small',
  FILE_SIZE_REQUIRED: 'File size is required',
  FILE_SIZE_INVALID: 'File size is invalid',
  FILE_SIZE_LIMIT: 'File size must be at least 1 byte and at most 30MB',
  FILE_EMPTY: 'File is empty'
} as const

export const imageMessages = {
  IMAGE_UPLOADED_SUCCESSFULLY: 'Image uploaded successfully',
  IMAGE_NOT_FOUND: 'Image not found'
} as const

export const videoMessages = {
  VIDEO_UPLOADED_SUCCESSFULLY: 'Video uploaded successfully',
  VIDEO_NOT_FOUND: 'Video not found'
} as const

export const tweetMessages = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  INVALID_CONTENT: 'Invalid content',
  PARENT_ID_MUST_BE_VALID_OBJECT_ID: 'Parent ID must be a valid ObjectId',
  PARENT_ID_MUST_BE_NULL: 'Parent ID must be null',
  CONTENT_MUST_BE_NOT_EMPTY: 'Content must be not empty',
  CONTENT_MUST_BE_EMPTY: 'Content must be empty',
  HASHTAGS_MUST_BE_ARRAY_OF_STRINGS: 'Hashtags must be an array of strings',
  MENTIONS_MUST_BE_ARRAY_OF_OBJECT_IDS: 'Mentions must be an array of ObjectIds',
  MEDIAS_MUST_BE_ARRAY_OF_OBJECTS: 'Medias must be an array of objects',
  TWEET_CREATED_SUCCESSFULLY: 'Tweet created successfully',
  TWEET_ID_MUST_BE_VALID_OBJECT_ID: 'Tweet ID must be a valid ObjectId',
  TWEET_NOT_FOUND: 'Tweet not found',
  TWEET_IS_NOT_PUBLIC: 'Tweet is not public',
  TWEET_CHILDREN_FETCHED_SUCCESSFULLY: 'Get Tweet children successfully',
  INVALID_TWEET_TYPE: 'Invalid tweet type',
  MAX_LIMIT_IS_100: 'Max limit is 100',
  MIN_LIMIT_IS_1: 'Min limit is 1',
  MIN_PAGE_IS_1: 'Min page is 1',
  TWEET_NEW_FEEDS_SUCCESSFULLY: 'Get new feeds successfully'
} as const

export const bookmarkMessages = {
  BOOKMARK_CREATED_SUCCESSFULLY: 'Bookmark created successfully',
  BOOKMARK_DELETED_SUCCESSFULLY: 'Bookmark deleted successfully',
  BOOKMARK_NOT_FOUND: 'Bookmark not found'
} as const

export const likeMessages = {
  LIKE_CREATED_SUCCESSFULLY: 'Like created successfully',
  LIKE_DELETED_SUCCESSFULLY: 'Like deleted successfully',
  LIKE_NOT_FOUND: 'Like not found'
} as const
