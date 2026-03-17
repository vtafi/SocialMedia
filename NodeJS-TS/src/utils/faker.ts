import { ObjectId } from 'mongodb'
import { faker } from '@faker-js/faker'
import { TweetRequestBody } from '~/models/requests/tweet.requests'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import { hashPassword } from './crypto'
import UserModel from '~/models/user.model'
import FollowersModel from '~/models/follower.model'
import { TweetService } from '~/services/tweet.service'
import { RegisterRequestBody } from '~/models/requests/user.requests'

// Config
const PASSWORD = 'tai123'
// Đảm bảo ID này CÓ TỒN TẠI trong DB của bạn, hoặc tạo mới nếu chưa có
const MYID = new ObjectId('6909fd3f793566c4ff80ccff')
const USER_COUNT = 100

// 1. Hàm tạo data User giả
const createUser = (): RegisterRequestBody => {
  return {
    email: faker.internet.email(),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    date_of_birth: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }).toISOString(),
    name: faker.person.fullName()
  }
}

// 2. Hàm tạo data Tweet giả
const createRandomTweet = (): TweetRequestBody => {
  return {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({ min: 1, max: 3 }), // Giảm max xuống để nội dung gọn hơn
    hashtags: [],
    medias: [],
    mentions: [],
    parent_id: null
  }
}

// Tạo mảng user data
const usersData: RegisterRequestBody[] = faker.helpers.multiple(createUser, { count: USER_COUNT })

// 3. Insert Users vào DB
const insertMultipleUsers = async (users: RegisterRequestBody[]): Promise<ObjectId[]> => {
  const result = await Promise.all(
    users.map(async (user) => {
      const _id = new ObjectId() // Tạo ObjectId trước

      await UserModel.create({
        _id: _id, // Gán cứng ID này vào document để đồng bộ
        ...user,
        username: `user_${_id.toString()}`, // SỬA LỖI: Dùng backtick ``
        password: hashPassword(user.password),
        date_of_birth: new Date(user.date_of_birth),
        verify: UserVerifyStatus.Verified
      })

      return _id // Trả về ObjectId thật sự đã lưu trong DB
    })
  )
  console.log(`Đã tạo thành công ${result.length} users`)
  return result
}

// 4. Follow Users
const followMultipleUsers = async (currentUserId: ObjectId, userIdsToFollow: ObjectId[]) => {
  await Promise.all(
    userIdsToFollow.map(async (id) => {
      await FollowersModel.create({
        user_id: currentUserId, // MYID đi follow người khác
        followed_user_id: id
      })
    })
  )
  console.log(`User ${currentUserId} đã follow ${userIdsToFollow.length} người dùng mới`)
}

// 5. Insert Tweets cho từng User
const insertMultipleTweets = async (userIds: ObjectId[]) => {
  let count = 0
  // Dùng map + Promise.all để chạy song song cho nhanh
  await Promise.all(
    userIds.map(async (userId) => {
      // Mỗi user tạo 2 tweets
      await Promise.all([
        TweetService.createTweet(userId.toString(), createRandomTweet()),
        TweetService.createTweet(userId.toString(), createRandomTweet())
      ])
      count += 2
    })
  )
  console.log(`Đã tạo tổng cộng ${count} tweets`)
}

// --- MAIN EXECUTION ---
const main = async () => {
  try {
    console.log('Bắt đầu seed data...')

    // Bước 1: Tạo users và lấy về danh sách ID chuẩn
    const userIds = await insertMultipleUsers(usersData)

    // Bước 2: Chạy song song việc Follow và Tweet để tiết kiệm thời gian
    await Promise.all([followMultipleUsers(MYID, userIds), insertMultipleTweets(userIds)])

    console.log('Hoàn tất seed data!')
    process.exit(0) // Thoát process khi xong
  } catch (error) {
    console.error('Lỗi khi seed data:', error)
    process.exit(1)
  }
}

main()
