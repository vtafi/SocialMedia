export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  VideoHLS
}

export enum TweetType {
  Tweet,
  ReTweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  Everyone,
  TweetCircle,
  OnlyMe
}
