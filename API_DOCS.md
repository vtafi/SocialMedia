# API DOCUMENTATION - User Module

## 📖 Mục lục
1. [Tạo User mới](#1-tạo-user-mới)
2. [Lấy tất cả Users](#2-lấy-tất-cả-users)
3. [Lấy User theo ID](#3-lấy-user-theo-id)
4. [Tìm kiếm Users](#4-tìm-kiếm-users)
5. [Cập nhật User](#5-cập-nhật-user)
6. [Xóa User](#6-xóa-user)

---

## 1. Tạo User mới

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "123456",
  "fullName": "John Doe"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "avatar": "https://via.placeholder.com/150",
    "bio": "",
    "role": "user",
    "isActive": true,
    "isEmailVerified": false,
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Username, email and password are required"
}
```

**Test với curl:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "123456",
    "fullName": "John Doe"
  }'
```

**Test với PowerShell:**
```powershell
$body = @{
    username = "john_doe"
    email = "john@example.com"
    password = "123456"
    fullName = "John Doe"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Post -Body $body -ContentType "application/json"
```

---

## 2. Lấy tất cả Users

**Endpoint:** `GET /api/users`

**Query Parameters:**
- `page` (optional): Số trang, mặc định = 1
- `limit` (optional): Số items mỗi trang, mặc định = 10

**Example:** `GET /api/users?page=1&limit=10`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatar": "https://via.placeholder.com/150",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Test với curl:**
```bash
curl http://localhost:3000/api/users?page=1&limit=10
```

**Test với PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users?page=1&limit=10"
```

---

## 3. Lấy User theo ID

**Endpoint:** `GET /api/users/:id`

**Example:** `GET /api/users/507f1f77bcf86cd799439011`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "avatar": "https://via.placeholder.com/150",
    "bio": "",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-10-15T10:00:00.000Z",
    "updatedAt": "2025-10-15T10:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Test với curl:**
```bash
curl http://localhost:3000/api/users/507f1f77bcf86cd799439011
```

**Test với PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/507f1f77bcf86cd799439011"
```

---

## 4. Tìm kiếm Users

**Endpoint:** `GET /api/users/search`

**Query Parameters:**
- `q` (required): Từ khóa tìm kiếm

**Example:** `GET /api/users/search?q=john`

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe",
      "avatar": "https://via.placeholder.com/150",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-10-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

**Test với curl:**
```bash
curl "http://localhost:3000/api/users/search?q=john"
```

**Test với PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/search?q=john"
```

---

## 5. Cập nhật User

**Endpoint:** `PUT /api/users/:id`

**Request Body:**
```json
{
  "fullName": "John Doe Updated",
  "bio": "I'm a developer",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe Updated",
    "bio": "I'm a developer",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user",
    "updatedAt": "2025-10-15T11:00:00.000Z"
  }
}
```

**Test với curl:**
```bash
curl -X PUT http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe Updated",
    "bio": "I am a developer"
  }'
```

**Test với PowerShell:**
```powershell
$body = @{
    fullName = "John Doe Updated"
    bio = "I am a developer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/507f1f77bcf86cd799439011" -Method Put -Body $body -ContentType "application/json"
```

---

## 6. Xóa User

**Endpoint:** `DELETE /api/users/:id`

**Example:** `DELETE /api/users/507f1f77bcf86cd799439011`

**Response Success (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Test với curl:**
```bash
curl -X DELETE http://localhost:3000/api/users/507f1f77bcf86cd799439011
```

**Test với PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/507f1f77bcf86cd799439011" -Method Delete
```

---

## 🧪 Testing Flow (Luồng test đầy đủ)

### 1. Khởi động server
```bash
npm run dev
```

### 2. Tạo một user mới
```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "123456"
    fullName = "Test User"
} | ConvertTo-Json

$newUser = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Post -Body $body -ContentType "application/json"
$userId = $newUser.data._id
Write-Host "Created user with ID: $userId"
```

### 3. Lấy thông tin user vừa tạo
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/$userId"
```

### 4. Cập nhật user
```powershell
$updateBody = @{
    fullName = "Test User Updated"
    bio = "This is my bio"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/$userId" -Method Put -Body $updateBody -ContentType "application/json"
```

### 5. Tìm kiếm user
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/search?q=test"
```

### 6. Lấy danh sách tất cả users
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users?page=1&limit=10"
```

### 7. Xóa user
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/$userId" -Method Delete
```

---

## 📝 Notes

- Tất cả response đều có format: `{ success: boolean, message?: string, data?: any }`
- Password được trả về trong response (chưa bảo mật, sẽ fix sau)
- Chưa có authentication/authorization (sẽ thêm JWT sau)
- Chưa có validation middleware (sẽ thêm sau)
