<div align="center">

# 🐦 Social Media Platform (Twitter Clone)

A high-performance, scalable social media backend built with modern technologies and engineering best practices.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_S3-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

</div>

---

## 📖 Introduction

This project is a **full-stack Twitter clone** demonstrating production-grade backend architecture and engineering principles. It showcases optimized database queries, real-time bidirectional communication, secure authentication flows, and automated media processing pipelines.

**Key Highlights:**

- 🚀 **Optimized MongoDB queries** with compound indexing and aggregation pipelines
- 🖼️ **Automated image compression pipeline** using Sharp + AWS S3
- 💬 **Real-time messaging** with Socket.IO for live chat and notifications
- 🔐 **Enterprise-grade security** with JWT Access/Refresh Token rotation

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB["React.js Web App"]
        MOBILE["Mobile Client"]
    end

    subgraph Gateway["API Gateway"]
        EXPRESS["Express.js Server"]
        MIDDLEWARE["Auth & Validation Middleware"]
    end

    subgraph Services["Core Services"]
        AUTH["Auth Service"]
        FEED["Tweet/Feed Service"]
        MEDIA["Media Service"]
        CHAT["Chat Service"]
        SEARCH["Search Service"]
    end

    subgraph DataLayer["Data Layer"]
        MONGO[(MongoDB)]
        REDIS[(Redis Cache)]
    end

    subgraph External["External Services"]
        S3["AWS S3"]
        EMAIL["Resend Email"]
    end

    WEB --> EXPRESS
    MOBILE --> EXPRESS
    EXPRESS --> MIDDLEWARE
    MIDDLEWARE --> AUTH
    MIDDLEWARE --> FEED
    MIDDLEWARE --> MEDIA
    MIDDLEWARE --> CHAT
    MIDDLEWARE --> SEARCH

    AUTH --> MONGO
    AUTH --> REDIS
    FEED --> MONGO
    MEDIA --> S3
    MEDIA --> MONGO
    CHAT --> MONGO
    SEARCH --> MONGO

    AUTH --> EMAIL

    style Client fill:#e1f5fe
    style Gateway fill:#fff3e0
    style Services fill:#e8f5e9
    style DataLayer fill:#fce4ec
    style External fill:#f3e5f5
```

---

## ⚙️ Key Features & Technical Deep Dive

### 🚀 High-Performance News Feed

**Challenge:** Rendering a personalized feed with complex social relationships (following, likes, retweets) at scale.

**Solution:**

- **Compound Indexing:** Created strategic MongoDB compound indexes on `user_id`, `created_at`, and `type` fields to minimize query time for timeline fetches.
- **Aggregation Pipelines:** Utilized MongoDB's powerful aggregation framework with `$lookup`, `$unwind`, and `$facet` stages to fetch tweets, user info, and engagement metrics in a single optimized query.
- **Result:** Reduced average feed query time from ~800ms to ~120ms under load testing.

```javascript
// Example: Compound Index Strategy
db.tweets.createIndex({ user_id: 1, created_at: -1, type: 1 });
db.tweets.createIndex({ hashtags: 1, created_at: -1 });
```

---

### 🖼️ Media Processing Pipeline

**Challenge:** Users upload high-resolution images that consume bandwidth and slow page load times.

**Solution:**

- **Sharp Integration:** Implemented an automated image processing pipeline using the `sharp` library to compress and convert all uploaded images to optimized JPEG format.
- **AWS S3 Storage:** All processed media is uploaded directly to AWS S3 for scalable, cost-effective storage with CDN-ready distribution.
- **HLS Video Streaming:** Videos are encoded to HLS (HTTP Live Streaming) format with multiple quality levels for adaptive streaming.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│   Sharp     │────▶│   AWS S3    │
│  (Raw Image)│     │ (Compress)  │     │  (Storage)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ JPEG Output │
                    │ (Optimized) │
                    └─────────────┘
```

---

### 💬 Real-Time Architecture

**Challenge:** Delivering instant message delivery and live notifications without constant polling.

**Solution:**

- **Socket.IO Integration:** Implemented bidirectional WebSocket communication for real-time features.
- **Event-Driven Design:** Messages, typing indicators, and notifications are pushed instantly to connected clients.
- **Conversation Management:** Persistent chat history with MongoDB, real-time updates via Socket.IO.

**Features:**

- ✅ Private 1-on-1 messaging
- ✅ Real-time typing indicators
- ✅ Read receipts
- ✅ Online presence detection

---

### 🔐 Security & Authentication Flow

**Challenge:** Implementing secure, stateless authentication that handles token expiration gracefully.

**Solution:**

- **JWT Token Strategy:**
  - **Access Token:** Short-lived (15 min) for API authorization
  - **Refresh Token:** Long-lived (7 days) stored securely for token rotation
- **Redis Session Management:** Refresh tokens are stored in Redis for fast validation and revocation capability.
- **Google OAuth Integration:** Seamless social login with Google OAuth 2.0.

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant R as Redis
    participant DB as MongoDB

    C->>S: POST /login (credentials)
    S->>DB: Validate User
    DB-->>S: User Found
    S->>S: Generate Access + Refresh Tokens
    S->>R: Store Refresh Token
    S-->>C: { accessToken, refreshToken }

    Note over C,S: Access Token Expires (15 min)

    C->>S: POST /refresh-token
    S->>R: Validate Refresh Token
    R-->>S: Token Valid
    S->>S: Rotate: New Access + Refresh Tokens
    S->>R: Update Refresh Token
    S-->>C: { newAccessToken, newRefreshToken }
```

---

## 🛠️ Tech Stack

| Category      | Technologies                                 |
| ------------- | -------------------------------------------- |
| **Backend**   | Node.js, Express.js 5, TypeScript            |
| **Database**  | MongoDB (Mongoose ODM)                       |
| **Caching**   | Redis                                        |
| **Real-Time** | Socket.IO                                    |
| **Media**     | Sharp (Image Processing), FFmpeg (Video/HLS) |
| **Cloud**     | AWS S3                                       |
| **Email**     | Resend                                       |
| **Auth**      | JWT, Google OAuth 2.0                        |
| **DevOps**    | Docker, Docker Compose                       |
| **Docs**      | Swagger/OpenAPI                              |
| **Frontend**  | React.js, TypeScript                         |

---

## 📊 Database Schema (ERD)

The application uses MongoDB with Mongoose ODM. Below are the core collections:

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string email UK
        string name
        string username UK
        string password
        string avatar
        string bio
        date date_of_birth
        string verify_status
        string forgot_password_token
        date created_at
        date updated_at
    }

    TWEET {
        ObjectId _id PK
        ObjectId user_id FK
        string type
        string content
        array media
        array hashtags
        array mentions
        int guest_views
        int user_views
        date created_at
    }

    FOLLOWER {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId followed_user_id FK
        date created_at
    }

    LIKE {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId tweet_id FK
        date created_at
    }

    BOOKMARK {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId tweet_id FK
        date created_at
    }

    REFRESH_TOKEN {
        ObjectId _id PK
        ObjectId user_id FK
        string token
        date created_at
        date exp
    }

    HASHTAG {
        ObjectId _id PK
        string name UK
        date created_at
    }

    CONVERSATION {
        ObjectId _id PK
        ObjectId sender_id FK
        ObjectId receiver_id FK
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId conversation_id FK
        ObjectId sender_id FK
        string content
        date created_at
    }

    USER ||--o{ TWEET : creates
    USER ||--o{ FOLLOWER : follows
    USER ||--o{ LIKE : likes
    USER ||--o{ BOOKMARK : bookmarks
    USER ||--o{ REFRESH_TOKEN : has
    TWEET ||--o{ LIKE : receives
    TWEET ||--o{ BOOKMARK : receives
    TWEET }o--o{ HASHTAG : contains
    USER ||--o{ CONVERSATION : participates
    CONVERSATION ||--o{ MESSAGE : contains
```

---

### API Endpoints Overview

| Module     | Endpoint                        | Description         |
| ---------- | ------------------------------- | ------------------- |
| **Auth**   | `POST /users/register`          | User registration   |
| **Auth**   | `POST /users/login`             | User authentication |
| **Auth**   | `POST /users/refresh-token`     | Token refresh       |
| **Auth**   | `GET /users/oauth/google`       | Google OAuth        |
| **Tweets** | `POST /tweets`                  | Create a tweet      |
| **Tweets** | `GET /tweets/:id`               | Get tweet by ID     |
| **Tweets** | `GET /tweets`                   | Get news feed       |
| **Media**  | `POST /medias/upload-image`     | Upload image        |
| **Media**  | `POST /medias/upload-video-hls` | Upload HLS video    |
| **Search** | `GET /search`                   | Search tweets       |
| **Chat**   | `WebSocket /`                   | Real-time messaging |

<!-- 📄 **Full API Documentation:** [`API_DOCUMENT.yaml`](./NodeJS-TS/API_DOCUMENT.yaml) -->

---

## 📁 Project Structure

```
Twitter/
├── NodeJS-TS/                 # Backend Application
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── services/          # Business logic
│   │   ├── models/            # MongoDB schemas
│   │   ├── middlewares/       # Auth & validation
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Helpers & utilities
│   │   └── constants/         # Enums & config
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
└── ReatJS-TS/                 # Frontend Application
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   └── services/
    └── package.json
```

---
