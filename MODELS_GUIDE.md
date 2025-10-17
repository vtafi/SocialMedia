# Hướng dẫn tạo Models với Mongoose + TypeScript

## 📁 Cấu trúc thư mục

```
src/models/
├── schemas/              # Định nghĩa schema và interface
│   ├── User.schema.ts
│   ├── Post.schema.ts
│   ├── Comment.schema.ts
│   ├── Category.schema.ts
│   └── ...
├── User.model.ts        # Export model
├── Post.model.ts
├── Comment.model.ts
├── Category.model.ts
└── index.ts            # Export tất cả models
```

## 🎯 Quy trình tạo một Model mới

### Bước 1: Tạo Schema file

**File: `src/models/schemas/YourModel.schema.ts`**

```typescript
import { Schema, Types } from 'mongoose'

// 1. Định nghĩa Interface (TypeScript type)
export interface IYourModel {
  _id?: Types.ObjectId
  field1: string
  field2: number
  reference: Types.ObjectId // Cho relations
  createdAt: Date
  updatedAt: Date
}

// 2. Tạo Schema
const YourModelSchema = new Schema<IYourModel>(
  {
    field1: {
      type: String,
      required: true,
      trim: true
    },
    field2: {
      type: Number,
      default: 0
    },
    reference: {
      type: Schema.Types.ObjectId,
      ref: 'OtherModel'
    }
  },
  {
    timestamps: true, // Auto createdAt, updatedAt
    versionKey: false // Tắt __v
  }
)

// 3. Thêm indexes nếu cần
YourModelSchema.index({ field1: 1 })

// 4. Export
export default YourModelSchema
```

### Bước 2: Tạo Model file

**File: `src/models/YourModel.model.ts`**

```typescript
import { model } from 'mongoose'
import YourModelSchema, { IYourModel } from './schemas/YourModel.schema'

const YourModelModel = model<IYourModel>('YourModel', YourModelSchema)

export default YourModelModel
```

### Bước 3: Export trong index.ts

**File: `src/models/index.ts`**

```typescript
export { default as YourModelModel } from './YourModel.model'
export type { IYourModel } from './schemas/YourModel.schema'
```

## 📝 Các kiểu dữ liệu thường dùng

```typescript
// String
name: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 }

// Number
age: { type: Number, min: 0, max: 150, default: 0 }

// Boolean
isActive: { type: Boolean, default: true }

// Date
birthDate: { type: Date }

// Array of Strings
tags: { type: [String], default: [] }

// Array of Numbers
scores: [{ type: Number }]

// Reference (ObjectId)
author: { type: Schema.Types.ObjectId, ref: 'User', required: true }

// Array of References
followers: [{ type: Schema.Types.ObjectId, ref: 'User' }]

// Enum
status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' }

// Mixed (any type)
metadata: { type: Schema.Types.Mixed }

// Nested Object
address: {
  street: String,
  city: String,
  country: String
}
```

## 🔧 Các tính năng nâng cao

### 1. Indexes

```typescript
// Single field
UserSchema.index({ email: 1 })

// Compound index
PostSchema.index({ author: 1, createdAt: -1 })

// Unique index
UserSchema.index({ username: 1 }, { unique: true })

// Text index (cho full-text search)
PostSchema.index({ title: 'text', content: 'text' })
```

### 2. Virtual Fields

```typescript
// Virtual populate
PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
})

// Virtual property
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})
```

### 3. Methods

```typescript
// Instance methods
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Static methods
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email })
}
```

### 4. Middleware (Hooks)

```typescript
// Pre-save hook
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

// Post-save hook
PostSchema.post('save', function (doc) {
  console.log('Post saved:', doc._id)
})

// Pre-remove hook
UserSchema.pre('remove', async function (next) {
  // Delete all posts by this user
  await PostModel.deleteMany({ author: this._id })
  next()
})
```

### 5. Custom toJSON

```typescript
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password // Không trả về password
  delete obj.__v
  return obj
}
```

## 💡 Cách sử dụng

### Import models

```typescript
// Import từ index
import { UserModel, PostModel, CommentModel } from '@/models'
import type { IUser, IPost, IComment } from '@/models'

// Hoặc import riêng lẻ
import UserModel from '@/models/User.model'
```

### CRUD Operations

```typescript
// Create
const newUser = await UserModel.create({
  username: 'john_doe',
  email: 'john@example.com',
  password: '123456'
})

// Read
const user = await UserModel.findById(userId)
const users = await UserModel.find({ isActive: true })

// Update
await UserModel.findByIdAndUpdate(userId, { fullName: 'John Doe' })

// Delete
await UserModel.findByIdAndDelete(userId)

// With populate
const post = await PostModel.findById(postId).populate('author', 'username email').populate('comments')
```

## 🗂️ Template cho 15 models phổ biến

1. **User** - Người dùng
2. **Post** - Bài viết
3. **Comment** - Bình luận
4. **Category** - Danh mục
5. **Tag** - Thẻ tag
6. **Like** - Lượt thích
7. **Follow** - Theo dõi
8. **Notification** - Thông báo
9. **Message** - Tin nhắn
10. **Conversation** - Cuộc trò chuyện
11. **Media** - File media (ảnh, video)
12. **Report** - Báo cáo vi phạm
13. **Setting** - Cài đặt
14. **Activity** - Lịch sử hoạt động
15. **Session** - Phiên đăng nhập

## 🚀 Connect Database

```typescript
// src/index.ts
import connectDB from '@/config/database'

// Connect to MongoDB
await connectDB()
```

## ⚙️ Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/your-database-name
# Hoặc MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
```

## 📦 Dependencies cần cài

```bash
npm install mongoose
npm install -D @types/mongoose
```
