# System Design Specification (SDS)

## Twitter Clone - Social Media Platform

**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Project Type:** Full-Stack Social Media Application

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Core System Flows](#core-system-flows)
4. [Data Models](#data-models)
5. [API Specifications](#api-specifications)
6. [Security Design](#security-design)
7. [Performance Optimization](#performance-optimization)
8. [Real-Time Communication](#real-time-communication)

---

## 1. System Overview

### 1.1 Purpose

This document describes the system design and technical specifications for a Twitter-like social media platform. The system enables users to post tweets, follow other users, engage with content through likes and bookmarks, upload media, and communicate in real-time.

### 1.2 Technology Stack

| Layer                | Technologies                        |
| -------------------- | ----------------------------------- |
| **Frontend**         | React.js, TypeScript, Vite          |
| **Backend**          | Node.js, Express.js 5, TypeScript   |
| **Database**         | MongoDB (Mongoose ODM)              |
| **Cache**            | Redis                               |
| **Real-Time**        | Socket.IO                           |
| **Media Processing** | Sharp (Images), FFmpeg (Videos/HLS) |
| **Cloud Storage**    | AWS S3                              |
| **Email Service**    | Resend                              |
| **Authentication**   | JWT, Google OAuth 2.0               |
| **DevOps**           | Docker, Docker Compose              |

### 1.3 Key Features

- ✅ User authentication (Email/Password, Google OAuth)
- ✅ Tweet creation (Text, Images, Videos)
- ✅ Social interactions (Like, Retweet, Comment, Quote)
- ✅ Follow/Unfollow system
- ✅ Real-time chat messaging
- ✅ Media upload with optimization
- ✅ Search functionality
- ✅ Bookmark management
- ✅ News feed with pagination

---

## 2. Architecture Design

### 2.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB["React Web App<br/>(TypeScript)"]
        MOBILE["Mobile Client"]
    end

    subgraph Gateway["API Gateway Layer"]
        EXPRESS["Express.js Server<br/>Port: 8386"]
        MIDDLEWARE["Middleware Pipeline"]
    end

    subgraph Services["Service Layer"]
        AUTH["Authentication Service"]
        USER["User Service"]
        TWEET["Tweet Service"]
        MEDIA["Media Service"]
        CHAT["Chat Service"]
        SEARCH["Search Service"]
        BOOKMARK["Bookmark Service"]
        LIKE["Like Service"]
    end

    subgraph Data["Data Layer"]
        MONGO[("MongoDB<br/>Primary Database")]
        REDIS[("Redis<br/>Cache & Sessions")]
    end

    subgraph External["External Services"]
        S3["AWS S3<br/>Media Storage"]
        EMAIL["Resend<br/>Email Service"]
        OAUTH["Google OAuth 2.0"]
    end

    WEB --> EXPRESS
    MOBILE --> EXPRESS
    EXPRESS --> MIDDLEWARE

    MIDDLEWARE --> AUTH
    MIDDLEWARE --> USER
    MIDDLEWARE --> TWEET
    MIDDLEWARE --> MEDIA
    MIDDLEWARE --> CHAT
    MIDDLEWARE --> SEARCH
    MIDDLEWARE --> BOOKMARK
    MIDDLEWARE --> LIKE

    AUTH --> MONGO
    AUTH --> REDIS
    AUTH --> EMAIL
    AUTH --> OAUTH

    USER --> MONGO
    TWEET --> MONGO
    MEDIA --> S3
    MEDIA --> MONGO
    CHAT --> MONGO
    SEARCH --> MONGO
    BOOKMARK --> MONGO
    LIKE --> MONGO

    style Client fill:#e1f5fe
    style Gateway fill:#fff3e0
    style Services fill:#e8f5e9
    style Data fill:#fce4ec
    style External fill:#f3e5f5
```

### 2.2 Directory Structure

```
Twitter/
├── NodeJS-TS/                    # Backend Application
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   │   ├── user.controller.ts
│   │   │   ├── tweet.controller.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── search.controller.ts
│   │   │   ├── bookmark.controller.ts
│   │   │   └── like.controller.ts
│   │   ├── services/             # Business logic
│   │   │   ├── user.service.ts
│   │   │   ├── tweet.service.ts
│   │   │   ├── media.service.ts
│   │   │   └── ...
│   │   ├── models/               # Data models
│   │   │   ├── schemas/          # MongoDB schemas
│   │   │   └── requests/         # Request DTOs
│   │   ├── middlewares/          # Validation & Auth
│   │   │   ├── user.middlewares.ts
│   │   │   ├── tweet.middlewares.ts
│   │   │   ├── common.middlewares.ts
│   │   │   └── error.middlewares.ts
│   │   ├── routes/               # API routes
│   │   │   ├── user.routes.ts
│   │   │   ├── tweet.routes.ts
│   │   │   ├── media.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   └── ...
│   │   ├── utils/                # Utilities
│   │   ├── constants/            # Configuration
│   │   └── database/             # DB connections
│   │       ├── mongo.database.ts
│   │       └── redis.database.ts
│   ├── Dockerfile
│   ├── API_DOCUMENT.yaml
│   └── package.json
│
└── ReatJS-TS/                    # Frontend Application
    ├── src/
    │   ├── pages/                # Page components
    │   │   └── Login/
    │   ├── components/           # Reusable components
    │   ├── hooks/                # Custom hooks
    │   ├── utils/                # Utilities
    │   ├── router.tsx            # Route configuration
    │   └── socket.tsx            # Socket.IO client
    └── package.json
```

---

## 3. Core System Flows

### 3.1 Authentication Flow

#### 3.1.1 User Registration Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant V as Validator
    participant US as User Service
    participant DB as MongoDB
    participant E as Email Service

    C->>API: POST /users/register<br/>{name, email, password, date_of_birth}
    API->>V: Validate request body
    V->>V: Check email format
    V->>V: Validate password strength
    V->>V: Confirm password match

    alt Validation fails
        V-->>C: 400 Bad Request
    end

    V->>US: Process registration
    US->>DB: Check if email exists

    alt Email already exists
        DB-->>C: 409 Conflict
    end

    US->>US: Hash password (bcrypt)
    US->>US: Generate email_verify_token (JWT)
    US->>DB: Create user document
    US->>US: Generate access_token (15 min)
    US->>US: Generate refresh_token (7 days)
    US->>DB: Store refresh_token
    US->>E: Send verification email
    US-->>C: 200 OK<br/>{access_token, refresh_token, user}
```

#### 3.1.2 User Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant V as Validator
    participant US as User Service
    participant DB as MongoDB
    participant R as Redis

    C->>API: POST /users/login<br/>{email, password}
    API->>V: Validate credentials
    V->>DB: Find user by email

    alt User not found
        DB-->>C: 401 Unauthorized
    end

    V->>V: Compare password hash

    alt Password incorrect
        V-->>C: 401 Unauthorized
    end

    US->>US: Generate access_token (15 min)
    US->>US: Generate refresh_token (7 days)
    US->>R: Store refresh_token in Redis
    US->>DB: Update last_login timestamp
    US-->>C: 200 OK<br/>{access_token, refresh_token, user}
```

#### 3.1.3 Token Refresh Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant V as Validator
    participant R as Redis
    participant US as User Service

    C->>API: POST /users/refresh-token<br/>{refresh_token}
    API->>V: Validate refresh_token (JWT)

    alt Token invalid or expired
        V-->>C: 401 Unauthorized
    end

    V->>R: Check token in Redis

    alt Token not found
        R-->>C: 401 Unauthorized
    end

    US->>US: Generate new access_token
    US->>US: Generate new refresh_token
    US->>R: Update refresh_token in Redis
    US->>R: Invalidate old refresh_token
    US-->>C: 200 OK<br/>{access_token, refresh_token}
```

#### 3.1.4 Google OAuth Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant G as Google OAuth
    participant US as User Service
    participant DB as MongoDB
    participant R as Redis

    C->>API: GET /users/oauth/google
    API->>G: Redirect to Google consent
    G->>C: Show consent screen
    C->>G: Approve access
    G->>API: Callback with auth code
    API->>G: Exchange code for tokens
    G-->>API: {access_token, id_token}
    API->>API: Decode id_token (user info)
    API->>DB: Find or create user

    alt New user
        DB->>DB: Create user with verified status
    end

    API->>US: Generate JWT tokens
    US->>R: Store refresh_token
    API-->>C: Redirect with tokens
```

#### 3.1.5 Password Reset Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant US as User Service
    participant DB as MongoDB
    participant E as Email Service

    Note over C,E: Step 1: Request Password Reset
    C->>API: POST /users/forgot-password<br/>{email}
    API->>DB: Find user by email

    alt User not found
        DB-->>C: 200 OK (security: don't reveal)
    end

    US->>US: Generate forgot_password_token (JWT)
    US->>DB: Save token to user document
    US->>E: Send reset email with token
    E-->>C: 200 OK

    Note over C,E: Step 2: Verify Token
    C->>API: POST /users/verify-forgot-password<br/>{forgot_password_token}
    API->>DB: Find user with token
    API->>API: Verify JWT token

    alt Token invalid/expired
        API-->>C: 401 Unauthorized
    end

    API-->>C: 200 OK (token valid)

    Note over C,E: Step 3: Reset Password
    C->>API: POST /users/reset-password<br/>{forgot_password_token, password, confirmPassword}
    API->>DB: Find user with token
    API->>API: Hash new password
    API->>DB: Update password
    API->>DB: Clear forgot_password_token
    API-->>C: 200 OK
```

---

### 3.2 Tweet Management Flow

#### 3.2.1 Create Tweet Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant V as Tweet Validator
    participant TS as Tweet Service
    participant DB as MongoDB

    C->>API: POST /tweets<br/>Authorization: Bearer {token}<br/>{type, audience, content, medias, hashtags, mentions}
    API->>Auth: Validate access_token

    alt Token invalid
        Auth-->>C: 401 Unauthorized
    end

    Auth->>Auth: Verify user status

    alt User not verified
        Auth-->>C: 403 Forbidden
    end

    API->>V: Validate tweet data
    V->>V: Check content length
    V->>V: Validate media URLs
    V->>V: Validate hashtags format
    V->>V: Validate mentions (user IDs)

    alt Validation fails
        V-->>C: 400 Bad Request
    end

    V->>TS: Process tweet creation
    TS->>DB: Extract/create hashtags
    TS->>DB: Create tweet document
    TS->>DB: Update user's tweet count
    TS-->>C: 201 Created<br/>{tweet}
```

#### 3.2.2 Get News Feed Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant TS as Tweet Service
    participant DB as MongoDB
    participant Cache as Redis

    C->>API: GET /tweets?page=1&limit=10<br/>Authorization: Bearer {token}
    API->>Auth: Validate access_token (optional)

    alt User logged in
        Auth->>Auth: Extract user_id
    end

    API->>Cache: Check feed cache

    alt Cache hit
        Cache-->>C: Return cached feed
    end

    API->>TS: Build feed query

    alt User logged in
        TS->>DB: Get followed users
        TS->>DB: Aggregate tweets from followed users
    else Guest user
        TS->>DB: Get public tweets
    end

    TS->>DB: Aggregation pipeline:<br/>1. Match tweets from followed users<br/>2. Lookup user info<br/>3. Lookup engagement (likes, retweets)<br/>4. Sort by created_at DESC<br/>5. Paginate (skip, limit)
    DB-->>TS: Tweet documents with user info
    TS->>Cache: Store in cache (TTL: 5 min)
    TS-->>C: 200 OK<br/>{tweets, pagination}
```

#### 3.2.3 Get Tweet Detail Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant V as Tweet Validator
    participant TS as Tweet Service
    participant DB as MongoDB

    C->>API: GET /tweets/:tweet_id
    API->>V: Validate tweet_id (ObjectId)

    alt Invalid ID format
        V-->>C: 400 Bad Request
    end

    API->>Auth: Check if user logged in
    API->>DB: Find tweet by ID

    alt Tweet not found
        DB-->>C: 404 Not Found
    end

    API->>V: Check audience permissions

    alt Tweet is private & user not authorized
        V-->>C: 403 Forbidden
    end

    TS->>DB: Increment view count

    alt User logged in
        DB->>DB: Increment user_views
    else Guest
        DB->>DB: Increment guest_views
    end

    TS->>DB: Aggregate tweet with:<br/>- User info<br/>- Like count<br/>- Retweet count<br/>- Comment count<br/>- Bookmark status
    TS-->>C: 200 OK<br/>{tweet, engagement}
```

---

### 3.3 Media Upload Flow

#### 3.3.1 Image Upload Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant MS as Media Service
    participant Sharp as Sharp Library
    participant S3 as AWS S3
    participant DB as MongoDB

    C->>API: POST /medias/upload-image<br/>Content-Type: multipart/form-data<br/>Authorization: Bearer {token}
    API->>Auth: Validate access_token

    alt Token invalid
        Auth-->>C: 401 Unauthorized
    end

    API->>MS: Process image upload
    MS->>MS: Validate file type (jpg, png, gif)
    MS->>MS: Validate file size (< 5MB)

    alt Validation fails
        MS-->>C: 400 Bad Request
    end

    MS->>Sharp: Compress image
    Sharp->>Sharp: Resize if needed (max 2048px)
    Sharp->>Sharp: Convert to JPEG
    Sharp->>Sharp: Optimize quality (80%)
    Sharp-->>MS: Optimized buffer

    MS->>S3: Upload to S3 bucket
    S3-->>MS: S3 URL

    MS->>DB: Save media metadata<br/>{url, type: 0 (Image), user_id}
    MS-->>C: 200 OK<br/>{url, type}
```

#### 3.3.2 Video HLS Upload Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant MS as Media Service
    participant FFmpeg as FFmpeg
    participant S3 as AWS S3
    participant DB as MongoDB

    C->>API: POST /medias/upload-video-hls<br/>Content-Type: multipart/form-data<br/>Authorization: Bearer {token}
    API->>Auth: Validate access_token
    API->>MS: Process video upload
    MS->>MS: Validate file type (mp4, mov, avi)
    MS->>MS: Validate file size (< 100MB)

    alt Validation fails
        MS-->>C: 400 Bad Request
    end

    MS->>MS: Save to temp directory
    MS->>FFmpeg: Encode to HLS format
    FFmpeg->>FFmpeg: Create master playlist (.m3u8)
    FFmpeg->>FFmpeg: Generate segments (.ts files)
    FFmpeg->>FFmpeg: Create quality variants:<br/>- 1080p<br/>- 720p<br/>- 480p<br/>- 360p
    FFmpeg-->>MS: HLS files

    MS->>S3: Upload all HLS files to S3
    S3-->>MS: Master playlist URL

    MS->>MS: Delete temp files
    MS->>DB: Save media metadata<br/>{url, type: 2 (VideoHLS), user_id}
    MS-->>C: 200 OK<br/>{url, type}
```

---

### 3.4 Real-Time Chat Flow

#### 3.4.1 WebSocket Connection Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as Socket.IO Server
    participant Auth as Auth Service
    participant DB as MongoDB

    C->>WS: Connect with auth token<br/>ws://localhost:8386?token={access_token}
    WS->>Auth: Validate access_token

    alt Token invalid
        Auth-->>C: Disconnect (unauthorized)
    end

    WS->>WS: Store socket in connection pool<br/>{user_id: socket_id}
    WS->>DB: Update user online status
    WS->>C: Emit 'connected' event
    WS->>C: Broadcast 'user_online' to friends

    Note over C,DB: User disconnects
    C->>WS: Disconnect
    WS->>WS: Remove from connection pool
    WS->>DB: Update user offline status
    WS->>C: Broadcast 'user_offline' to friends
```

#### 3.4.2 Send Message Flow

```mermaid
sequenceDiagram
    participant C1 as Client (Sender)
    participant WS as Socket.IO Server
    participant CS as Chat Service
    participant DB as MongoDB
    participant C2 as Client (Receiver)

    C1->>WS: Emit 'send_message'<br/>{receiver_id, content}
    WS->>CS: Process message
    CS->>DB: Find or create conversation<br/>{participants: [sender_id, receiver_id]}

    alt Conversation exists
        DB-->>CS: Return conversation_id
    else New conversation
        DB->>DB: Create conversation
        DB-->>CS: Return new conversation_id
    end

    CS->>DB: Create message document<br/>{conversation_id, sender_id, content, created_at}
    DB-->>CS: Message saved

    CS->>WS: Get receiver socket

    alt Receiver online
        WS->>C2: Emit 'receive_message'<br/>{message, sender}
        C2->>WS: Emit 'message_read'<br/>{message_id}
        WS->>DB: Update read_by array
    else Receiver offline
        WS->>WS: Queue for later delivery
    end

    WS->>C1: Emit 'message_sent'<br/>{message}
```

#### 3.4.3 Typing Indicator Flow

```mermaid
sequenceDiagram
    participant C1 as Client (Sender)
    participant WS as Socket.IO Server
    participant C2 as Client (Receiver)

    C1->>WS: Emit 'typing_start'<br/>{receiver_id}
    WS->>WS: Get receiver socket

    alt Receiver online
        WS->>C2: Emit 'user_typing'<br/>{user_id, username}
    end

    Note over C1,C2: User stops typing (3s timeout)
    C1->>WS: Emit 'typing_stop'<br/>{receiver_id}
    WS->>C2: Emit 'user_stopped_typing'<br/>{user_id}
```

---

### 3.5 Social Interaction Flows

#### 3.5.1 Like Tweet Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant LS as Like Service
    participant DB as MongoDB
    participant WS as Socket.IO

    C->>API: POST /likes<br/>Authorization: Bearer {token}<br/>{tweet_id}
    API->>Auth: Validate access_token
    API->>DB: Check if already liked

    alt Already liked
        DB-->>C: 409 Conflict
    end

    LS->>DB: Create like document<br/>{user_id, tweet_id, created_at}
    LS->>DB: Increment tweet like_count
    LS->>DB: Get tweet author_id

    alt User likes own tweet
        LS-->>C: 200 OK
    end

    LS->>WS: Emit notification to tweet author<br/>'new_like' {user, tweet}
    LS-->>C: 200 OK<br/>{like}
```

#### 3.5.2 Follow User Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant US as User Service
    participant DB as MongoDB
    participant WS as Socket.IO

    C->>API: POST /users/follow<br/>Authorization: Bearer {token}<br/>{followed_user_id}
    API->>Auth: Validate access_token

    alt Following self
        API-->>C: 400 Bad Request
    end

    API->>DB: Check if already following

    alt Already following
        DB-->>C: 409 Conflict
    end

    US->>DB: Create follower document<br/>{user_id, followed_user_id, created_at}
    US->>DB: Increment follower count
    US->>DB: Increment following count
    US->>WS: Emit notification<br/>'new_follower' {user}
    US-->>C: 200 OK
```

#### 3.5.3 Bookmark Tweet Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant BS as Bookmark Service
    participant DB as MongoDB

    C->>API: POST /bookmarks<br/>Authorization: Bearer {token}<br/>{tweet_id}
    API->>Auth: Validate access_token
    API->>DB: Check if already bookmarked

    alt Already bookmarked
        DB-->>C: 409 Conflict
    end

    BS->>DB: Create bookmark document<br/>{user_id, tweet_id, created_at}
    BS-->>C: 200 OK<br/>{bookmark}

    Note over C,DB: Unbookmark
    C->>API: DELETE /bookmarks/:tweet_id
    API->>Auth: Validate access_token
    BS->>DB: Delete bookmark document
    BS-->>C: 200 OK
```

---

### 3.6 Search Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express API
    participant Auth as Auth Middleware
    participant SS as Search Service
    participant DB as MongoDB
    participant Cache as Redis

    C->>API: GET /search?content={query}&limit=20&page=1
    API->>Auth: Validate access_token (optional)
    API->>SS: Process search query
    SS->>SS: Sanitize query
    SS->>SS: Extract hashtags
    SS->>Cache: Check search cache

    alt Cache hit
        Cache-->>C: Return cached results
    end

    SS->>DB: Full-text search on tweets<br/>Match: content, hashtags
    SS->>DB: Aggregate with user info
    SS->>DB: Filter by audience permissions
    SS->>DB: Sort by relevance & date
    SS->>DB: Paginate results
    DB-->>SS: Search results
    SS->>Cache: Store in cache (TTL: 10 min)
    SS-->>C: 200 OK<br/>{tweets, pagination}
```

---

## 4. Frontend Architecture & Flows

### 4.1 Frontend Technology Stack

| Category             | Technology                 | Purpose                     |
| -------------------- | -------------------------- | --------------------------- |
| **Framework**        | React 18                   | UI library                  |
| **Language**         | TypeScript                 | Type safety                 |
| **Build Tool**       | Vite                       | Fast development & bundling |
| **Routing**          | React Router v6            | Client-side routing         |
| **Real-Time**        | Socket.IO Client           | WebSocket communication     |
| **Video Player**     | Vidstack                   | HLS video playback          |
| **State Management** | LocalStorage + React State | Authentication & app state  |

### 4.2 Frontend Directory Structure

```
ReatJS-TS/
├── src/
│   ├── pages/              # Page components
│   │   ├── Login/
│   │   └── Register/
│   ├── components/         # Reusable components
│   │   ├── auth/
│   │   └── Profile/
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── assets/             # Static assets
│   ├── App.tsx             # Root component
│   ├── router.tsx          # Route configuration
│   ├── socket.tsx          # Socket.IO client setup
│   ├── Home.tsx            # Home page
│   ├── Chat.tsx            # Chat page
│   └── Login.tsx           # Login page
└── package.json
```

---

### 4.3 Application Routing Flow

```mermaid
flowchart TB
    Start[User Opens App]
    Router{React Router}

    Start --> Router

    Router -->|"/ (root)"| Home[Home Page]
    Router -->|"/login"| Login[Login Page]
    Router -->|"/chat"| Chat[Chat Page]

    Home --> AuthCheck{Is Authenticated?}
    AuthCheck -->|Yes| HomeAuth[Show Logged In View]
    AuthCheck -->|No| HomeGuest[Show Login Button]

    Login --> LoginForm[Login Form]
    LoginForm --> API[API Call]
    API --> Success{Success?}
    Success -->|Yes| SaveTokens[Save Tokens to LocalStorage]
    Success -->|No| ShowError[Show Error Message]
    SaveTokens --> RedirectHome[Redirect to Home]

    Chat --> ChatAuthCheck{Is Authenticated?}
    ChatAuthCheck -->|Yes| InitSocket[Initialize Socket.IO]
    ChatAuthCheck -->|No| RedirectLogin[Redirect to Login]

    style Home fill:#e8f5e9
    style Login fill:#fff3e0
    style Chat fill:#e1f5fe
    style AuthCheck fill:#fce4ec
```

---

### 4.4 Authentication Flow (Frontend)

#### 4.4.1 Google OAuth Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Home as Home Component
    participant Browser as Browser
    participant Backend as Backend API
    participant Google as Google OAuth

    U->>Home: Click "Login with Google"
    Home->>Home: Generate OAuth URL
    Note over Home: getOauthGoogleUrl()
    Home->>Browser: Redirect to Google
    Browser->>Google: Show consent screen
    U->>Google: Approve access
    Google->>Backend: Callback with auth code
    Backend->>Backend: Exchange code for tokens
    Backend->>Backend: Create/find user
    Backend->>Browser: Redirect with tokens in URL
    Note over Browser: ?access_token=xxx&refresh_token=yyy
    Browser->>Home: Parse URL parameters
    Home->>Home: Extract tokens from URL
    Home->>Browser: localStorage.setItem('access_token')
    Home->>Browser: localStorage.setItem('refresh_token')
    Home->>Home: Update UI state
    Home->>U: Show logged in view
```

#### 4.4.2 Token Management Flow

```mermaid
flowchart TB
    APICall[Make API Call]
    GetToken{Get Access Token<br/>from LocalStorage}

    APICall --> GetToken
    GetToken -->|Token exists| AddHeader[Add Authorization Header]
    GetToken -->|No token| Reject[Reject - Redirect to Login]

    AddHeader --> SendRequest[Send HTTP Request]
    SendRequest --> Response{Response Status}

    Response -->|200 OK| Success[Process Response]
    Response -->|401 Unauthorized| TokenExpired{Token Expired?}

    TokenExpired -->|Yes| RefreshToken[Call Refresh Token API]
    TokenExpired -->|No| Logout[Logout User]

    RefreshToken --> RefreshSuccess{Refresh Success?}
    RefreshSuccess -->|Yes| UpdateTokens[Update LocalStorage]
    RefreshSuccess -->|No| Logout

    UpdateTokens --> RetryRequest[Retry Original Request]
    RetryRequest --> Success

    Logout --> ClearStorage[Clear LocalStorage]
    ClearStorage --> RedirectLogin[Redirect to /login]

    style Success fill:#c8e6c9
    style Logout fill:#ffcdd2
    style UpdateTokens fill:#fff9c4
```

#### 4.4.3 Logout Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Home as Home Component
    participant LS as LocalStorage
    participant API as Backend API
    participant Browser as Browser

    U->>Home: Click "Logout" button
    Home->>Home: logout() function called
    Home->>LS: localStorage.removeItem('access_token')
    Home->>LS: localStorage.removeItem('refresh_token')
    Home->>LS: localStorage.removeItem('profile')

    opt Optional: Notify backend
        Home->>API: POST /users/logout
        API->>API: Invalidate refresh token
    end

    Home->>Browser: window.location.reload()
    Browser->>Home: Reload page
    Home->>Home: Check authentication
    Home->>U: Show guest view
```

---

### 4.5 Real-Time Chat Flow (Frontend)

#### 4.5.1 Socket.IO Connection Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Chat as Chat Component
    participant Socket as Socket.IO Client
    participant LS as LocalStorage
    participant Server as Socket.IO Server

    U->>Chat: Navigate to /chat
    Chat->>Chat: useEffect() hook runs
    Chat->>LS: Get user profile
    LS-->>Chat: {_id, name, email}

    Chat->>Socket: socket.auth = {_id}
    Chat->>Socket: socket.connect()
    Socket->>Server: Connect with auth
    Server->>Server: Validate user
    Server-->>Socket: 'connected' event
    Socket->>Chat: Connection established
    Chat->>U: Show chat interface

    Note over U,Server: User leaves chat page
    U->>Chat: Navigate away
    Chat->>Chat: useEffect cleanup
    Chat->>Socket: socket.disconnect()
    Socket->>Server: Disconnect
```

#### 4.5.2 Send Message Flow (Frontend)

```mermaid
sequenceDiagram
    participant U as User
    participant Chat as Chat Component
    participant Form as Message Form
    participant Socket as Socket.IO Client
    participant Server as Socket.IO Server

    U->>Form: Type message
    Form->>Chat: Update state (setMessage)
    U->>Form: Click "Send" / Press Enter
    Form->>Chat: handleSubmit(e)
    Chat->>Chat: e.preventDefault()

    Chat->>Socket: emit('send_message', {receiver_id, content})
    Chat->>Chat: setMessage('') - Clear input
    Chat->>U: Clear message input

    Socket->>Server: Send message event
    Server->>Server: Process & save message
    Server-->>Socket: emit('message_sent', {message})
    Socket->>Chat: Message sent confirmation
    Chat->>Chat: Add message to local state
    Chat->>U: Display sent message

    Note over Server: Server sends to receiver
    Server-->>Socket: emit('receive_message', {message})
    Socket->>Chat: New message received
    Chat->>Chat: Add to messages array
    Chat->>U: Display new message
```

#### 4.5.3 Typing Indicator Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Input as Message Input
    participant Chat as Chat Component
    participant Socket as Socket.IO Client
    participant Server as Socket.IO Server
    participant Other as Other User

    U->>Input: Start typing
    Input->>Chat: onChange event
    Chat->>Socket: emit('typing_start', {receiver_id})
    Socket->>Server: Typing start event
    Server->>Other: emit('user_typing', {user_id, username})
    Other->>Other: Show "User is typing..."

    Note over U,Other: 3 seconds of inactivity

    Chat->>Socket: emit('typing_stop', {receiver_id})
    Socket->>Server: Typing stop event
    Server->>Other: emit('user_stopped_typing', {user_id})
    Other->>Other: Hide typing indicator
```

---

### 4.6 Component State Management

#### 4.6.1 Authentication State

```mermaid
flowchart LR
    subgraph LocalStorage
        AT[access_token]
        RT[refresh_token]
        Profile[profile JSON]
    end

    subgraph Component State
        IsAuth{isAuthenticated}
        User[user object]
    end

    subgraph UI
        LoginBtn[Login Button]
        LogoutBtn[Logout Button]
        UserInfo[User Info Display]
    end

    AT --> IsAuth
    RT --> IsAuth
    Profile --> User

    IsAuth -->|true| LogoutBtn
    IsAuth -->|true| UserInfo
    IsAuth -->|false| LoginBtn

    User --> UserInfo

    style LocalStorage fill:#e3f2fd
    style Component State fill:#f3e5f5
    style UI fill:#e8f5e9
```

#### 4.6.2 Chat State Management

```javascript
// Chat Component State Structure
const [message, setMessage] = useState(""); // Current input
const [messages, setMessages] = useState([]); // Message history
const [isConnected, setIsConnected] = useState(false); // Socket status
const [isTyping, setIsTyping] = useState(false); // Typing indicator
const [onlineUsers, setOnlineUsers] = useState([]); // Online status

// Socket Event Listeners
useEffect(() => {
  socket.on("connected", () => setIsConnected(true));
  socket.on("receive_message", (msg) => {
    setMessages((prev) => [...prev, msg]);
  });
  socket.on("user_typing", () => setIsTyping(true));
  socket.on("user_stopped_typing", () => setIsTyping(false));

  return () => {
    socket.off("connected");
    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_stopped_typing");
  };
}, []);
```

---

### 4.7 API Integration Flow

#### 4.7.1 HTTP Request Flow

```mermaid
sequenceDiagram
    participant C as React Component
    participant H as HTTP Client (fetch/axios)
    participant I as Interceptor
    participant API as Backend API
    participant LS as LocalStorage

    C->>H: Make API request
    H->>I: Request interceptor
    I->>LS: Get access_token
    LS-->>I: Return token
    I->>I: Add Authorization header
    I->>API: Send request with token

    alt Success Response
        API-->>I: 200 OK + data
        I->>C: Return data
        C->>C: Update component state
    else Token Expired
        API-->>I: 401 Unauthorized
        I->>LS: Get refresh_token
        I->>API: POST /users/refresh-token
        API-->>I: New tokens
        I->>LS: Update tokens
        I->>API: Retry original request
        API-->>I: 200 OK + data
        I->>C: Return data
    else Other Error
        API-->>I: 4xx/5xx Error
        I->>C: Throw error
        C->>C: Show error message
    end
```

#### 4.7.2 Error Handling Flow

```mermaid
flowchart TB
    Request[API Request]
    Response{Response Status}

    Request --> Response

    Response -->|200-299| Success[Process Data]
    Response -->|400| ValidationError[Show Validation Errors]
    Response -->|401| Unauthorized[Token Invalid]
    Response -->|403| Forbidden[Show Access Denied]
    Response -->|404| NotFound[Show Not Found]
    Response -->|409| Conflict[Show Conflict Message]
    Response -->|500| ServerError[Show Server Error]

    Unauthorized --> RefreshAttempt{Can Refresh?}
    RefreshAttempt -->|Yes| RefreshToken[Refresh Token]
    RefreshAttempt -->|No| ForceLogout[Force Logout]

    RefreshToken --> RetryRequest[Retry Request]
    RetryRequest --> Response

    ForceLogout --> ClearData[Clear LocalStorage]
    ClearData --> RedirectLogin[Redirect to /login]

    ValidationError --> ShowToast[Show Toast/Alert]
    Forbidden --> ShowToast
    NotFound --> ShowToast
    Conflict --> ShowToast
    ServerError --> ShowToast

    style Success fill:#c8e6c9
    style ForceLogout fill:#ffcdd2
    style ShowToast fill:#fff9c4
```

---

### 4.8 Media Upload Flow (Frontend)

#### 4.8.1 Image Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Input as File Input
    participant Component as Upload Component
    participant Preview as Image Preview
    participant API as Backend API
    participant S3 as AWS S3

    U->>Input: Select image file
    Input->>Component: onChange event
    Component->>Component: Validate file type
    Component->>Component: Validate file size (< 5MB)

    alt Validation fails
        Component->>U: Show error message
    end

    Component->>Preview: Create preview URL
    Preview->>U: Show image preview

    U->>Component: Click "Upload"
    Component->>Component: Create FormData
    Component->>Component: Show loading spinner

    Component->>API: POST /medias/upload-image
    Note over API: FormData with image file

    API->>API: Process with Sharp
    API->>S3: Upload optimized image
    S3-->>API: S3 URL
    API-->>Component: {url, type}

    Component->>Component: Hide loading spinner
    Component->>Component: Save URL to state
    Component->>U: Show success message
```

#### 4.8.2 Video Upload with Progress

```mermaid
sequenceDiagram
    participant U as User
    participant Input as File Input
    participant Component as Upload Component
    participant Progress as Progress Bar
    participant API as Backend API

    U->>Input: Select video file
    Input->>Component: onChange event
    Component->>Component: Validate file (< 100MB)

    U->>Component: Click "Upload"
    Component->>Component: Create FormData
    Component->>Progress: Show progress bar (0%)

    Component->>API: POST /medias/upload-video-hls
    Note over Component,API: XMLHttpRequest with progress tracking

    loop Upload Progress
        API-->>Component: Progress event
        Component->>Progress: Update (25%, 50%, 75%)
        Progress->>U: Visual feedback
    end

    API->>API: Encode to HLS
    Note over API: This may take time

    API-->>Component: {url, type: 2}
    Component->>Progress: Complete (100%)
    Component->>Component: Save HLS URL
    Component->>U: Show video player
```

---

### 4.9 Page-Specific Flows

#### 4.9.1 Home Page Flow

```mermaid
flowchart TB
    Load[Home Page Loads]
    CheckAuth{Check LocalStorage<br/>for access_token}

    Load --> CheckAuth

    CheckAuth -->|Token exists| AuthView[Authenticated View]
    CheckAuth -->|No token| GuestView[Guest View]

    AuthView --> ShowProfile[Display User Info]
    AuthView --> ShowLogout[Show Logout Button]
    AuthView --> ShowVideo[Show Video Player]

    GuestView --> ShowOAuth[Show "Login with Google"]
    GuestView --> GenerateURL[Generate OAuth URL]

    ShowOAuth --> UserClick{User Clicks Login}
    UserClick -->|Yes| Redirect[Redirect to Google]

    ShowLogout --> LogoutClick{User Clicks Logout}
    LogoutClick -->|Yes| ClearTokens[Clear LocalStorage]
    ClearTokens --> Reload[Reload Page]
    Reload --> Load

    style AuthView fill:#e8f5e9
    style GuestView fill:#fff3e0
```

#### 4.9.2 Chat Page Flow

```mermaid
flowchart TB
    Navigate[Navigate to /chat]
    CheckAuth{Is Authenticated?}

    Navigate --> CheckAuth

    CheckAuth -->|No| RedirectLogin[Redirect to /login]
    CheckAuth -->|Yes| LoadProfile[Load Profile from LocalStorage]

    LoadProfile --> InitSocket[Initialize Socket.IO]
    InitSocket --> SetAuth[Set socket.auth = {_id}]
    SetAuth --> Connect[socket.connect()]

    Connect --> WaitConnection{Connection Status}
    WaitConnection -->|Connected| ShowChat[Show Chat Interface]
    WaitConnection -->|Error| ShowError[Show Connection Error]

    ShowChat --> RenderInput[Render Message Input]
    ShowChat --> RenderMessages[Render Message List]
    ShowChat --> ListenEvents[Listen to Socket Events]

    ListenEvents --> ReceiveMsg[On 'receive_message']
    ListenEvents --> UserTyping[On 'user_typing']
    ListenEvents --> UserOnline[On 'user_online']

    ReceiveMsg --> UpdateMessages[Update messages state]
    UpdateMessages --> ReRender[Re-render UI]

    Note[User Leaves Page] --> Cleanup[useEffect cleanup]
    Cleanup --> Disconnect[socket.disconnect()]

    style ShowChat fill:#e8f5e9
    style ShowError fill:#ffcdd2
```

---

### 4.10 Performance Optimization (Frontend)

#### 4.10.1 Code Splitting

```javascript
// Lazy loading pages
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('./Home'))
const Chat = lazy(() => import('./Chat'))
const Login = lazy(() => import('./Login'))

// Router with suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/chat" element={<Chat />} />
    <Route path="/login" element={<Login />} />
  </Routes>
</Suspense>
```

#### 4.10.2 Caching Strategy

```mermaid
flowchart LR
    subgraph Browser Cache
        LS[LocalStorage]
        SC[Session Cache]
        IC[Image Cache]
    end

    subgraph Cached Data
        Tokens[Auth Tokens]
        Profile[User Profile]
        Messages[Recent Messages]
        Media[Media URLs]
    end

    Tokens --> LS
    Profile --> LS
    Messages --> SC
    Media --> IC

    LS -->|Persistent| Reload[Survives Reload]
    SC -->|Session Only| Close[Cleared on Close]
    IC -->|Browser Managed| Auto[Auto Eviction]

    style LS fill:#e3f2fd
    style SC fill:#f3e5f5
    style IC fill:#e8f5e9
```

#### 4.10.3 React Optimization Techniques

```javascript
// 1. Memoization
const MessageList = React.memo(({ messages }) => {
  return messages.map((msg) => <Message key={msg._id} {...msg} />);
});

// 2. useCallback for event handlers
const handleSendMessage = useCallback(
  (content) => {
    socket.emit("send_message", { receiver_id, content });
  },
  [receiver_id],
);

// 3. useMemo for expensive computations
const sortedMessages = useMemo(() => {
  return messages.sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
}, [messages]);

// 4. Debouncing for typing indicator
const debouncedTyping = debounce(() => {
  socket.emit("typing_stop", { receiver_id });
}, 3000);
```

---

### 4.11 Frontend Security Measures

| Security Concern         | Implementation                                          |
| ------------------------ | ------------------------------------------------------- |
| **XSS Prevention**       | React auto-escapes JSX content                          |
| **Token Storage**        | LocalStorage (consider httpOnly cookies for production) |
| **CSRF Protection**      | SameSite cookies + CORS configuration                   |
| **Input Validation**     | Client-side validation before API calls                 |
| **Secure Communication** | HTTPS only in production                                |
| **Token Expiration**     | Auto-refresh mechanism                                  |
| **Sensitive Data**       | Never log tokens to console in production               |

---

### 4.12 User Experience Flows

#### 4.12.1 Loading States

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: User Action
    Loading --> Success: API Success
    Loading --> Error: API Error
    Success --> Idle: Reset
    Error --> Idle: Retry/Dismiss

    Loading: Show Spinner
    Success: Show Success Message
    Error: Show Error Message
```

#### 4.12.2 Error Recovery Flow

```mermaid
flowchart TB
    Error[Error Occurs]
    Type{Error Type}

    Error --> Type

    Type -->|Network Error| Retry[Show Retry Button]
    Type -->|Validation Error| ShowFields[Highlight Invalid Fields]
    Type -->|Auth Error| Reauth[Redirect to Login]
    Type -->|Server Error| ShowMessage[Show Error Message]

    Retry --> UserRetry{User Clicks Retry}
    UserRetry -->|Yes| ResendRequest[Resend Request]
    UserRetry -->|No| Stay[Stay on Page]

    ShowFields --> UserFix[User Corrects Input]
    UserFix --> Resubmit[Resubmit Form]

    style Error fill:#ffcdd2
    style Retry fill:#fff9c4
    style Reauth fill:#e1f5fe
```

---

## 5. Data Models

### 4.1 Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string email UK "Unique email"
        string name
        string username UK "Unique username"
        string password "Hashed"
        string avatar "S3 URL"
        string cover_photo "S3 URL"
        string bio
        string location
        string website
        date date_of_birth
        int verify "0:Unverified, 1:Verified, 2:Banned"
        string email_verify_token
        string forgot_password_token
        date created_at
        date updated_at
    }

    TWEET {
        ObjectId _id PK
        ObjectId user_id FK
        int type "0:Tweet, 1:Retweet, 2:Comment, 3:Quote"
        int audience "0:Everyone, 1:Circle, 2:OnlyMe"
        string content
        ObjectId parent_id FK "For comments/quotes"
        array medias "Media objects"
        array hashtags "Hashtag IDs"
        array mentions "User IDs"
        int guest_views
        int user_views
        date created_at
        date updated_at
    }

    FOLLOWER {
        ObjectId _id PK
        ObjectId user_id FK "Follower"
        ObjectId followed_user_id FK "Following"
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
        string token "JWT"
        date created_at
        date exp "Expiration"
    }

    HASHTAG {
        ObjectId _id PK
        string name UK "Unique hashtag"
        date created_at
    }

    CONVERSATION {
        ObjectId _id PK
        array participants "User IDs [sender, receiver]"
        date created_at
        date updated_at
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId conversation_id FK
        ObjectId sender_id FK
        string content
        array read_by "User IDs who read"
        date created_at
    }

    USER ||--o{ TWEET : "creates"
    USER ||--o{ FOLLOWER : "follows"
    USER ||--o{ LIKE : "likes"
    USER ||--o{ BOOKMARK : "bookmarks"
    USER ||--o{ REFRESH_TOKEN : "has"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ CONVERSATION : "participates"

    TWEET ||--o{ LIKE : "receives"
    TWEET ||--o{ BOOKMARK : "receives"
    TWEET }o--o{ HASHTAG : "contains"
    TWEET ||--o{ TWEET : "parent_of"

    CONVERSATION ||--o{ MESSAGE : "contains"
```

### 4.2 MongoDB Indexes

#### User Collection

```javascript
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email_verify_token: 1 });
db.users.createIndex({ forgot_password_token: 1 });
```

#### Tweet Collection

```javascript
db.tweets.createIndex({ user_id: 1, created_at: -1 });
db.tweets.createIndex({ hashtags: 1, created_at: -1 });
db.tweets.createIndex({ parent_id: 1 });
db.tweets.createIndex({ type: 1, audience: 1, created_at: -1 });
```

#### Follower Collection

```javascript
db.followers.createIndex({ user_id: 1, followed_user_id: 1 }, { unique: true });
db.followers.createIndex({ followed_user_id: 1 });
```

#### Like Collection

```javascript
db.likes.createIndex({ user_id: 1, tweet_id: 1 }, { unique: true });
db.likes.createIndex({ tweet_id: 1, created_at: -1 });
```

#### Bookmark Collection

```javascript
db.bookmarks.createIndex({ user_id: 1, tweet_id: 1 }, { unique: true });
db.bookmarks.createIndex({ user_id: 1, created_at: -1 });
```

---

## 5. API Specifications

### 5.1 API Endpoint Summary

| Module        | Method    | Endpoint                        | Auth Required | Description                        |
| ------------- | --------- | ------------------------------- | ------------- | ---------------------------------- |
| **Users**     | POST      | `/users/register`               | ❌            | Register new user                  |
| **Users**     | POST      | `/users/login`                  | ❌            | Login with email/password          |
| **Users**     | GET       | `/users/oauth/google`           | ❌            | Google OAuth login                 |
| **Users**     | POST      | `/users/logout`                 | ✅            | Logout user                        |
| **Users**     | POST      | `/users/verify-email`           | ❌            | Verify email with token            |
| **Users**     | POST      | `/users/resend-verify-email`    | ✅            | Resend verification email          |
| **Users**     | POST      | `/users/forgot-password`        | ❌            | Request password reset             |
| **Users**     | POST      | `/users/verify-forgot-password` | ❌            | Verify reset token                 |
| **Users**     | POST      | `/users/reset-password`         | ❌            | Reset password                     |
| **Users**     | POST      | `/users/refresh-token`          | ✅            | Refresh access token               |
| **Users**     | GET       | `/users/me`                     | ✅            | Get current user profile           |
| **Users**     | PATCH     | `/users/me`                     | ✅            | Update user profile                |
| **Users**     | POST      | `/users/follow`                 | ✅            | Follow a user                      |
| **Users**     | DELETE    | `/users/unfollow/:id`           | ✅            | Unfollow a user                    |
| **Tweets**    | POST      | `/tweets`                       | ✅            | Create a tweet                     |
| **Tweets**    | GET       | `/tweets/:id`                   | ⚠️            | Get tweet detail (optional auth)   |
| **Tweets**    | GET       | `/tweets/:id/children`          | ⚠️            | Get tweet comments (optional auth) |
| **Tweets**    | GET       | `/tweets`                       | ⚠️            | Get news feed (optional auth)      |
| **Media**     | POST      | `/medias/upload-image`          | ✅            | Upload image                       |
| **Media**     | POST      | `/medias/upload-video`          | ✅            | Upload video                       |
| **Media**     | POST      | `/medias/upload-video-hls`      | ✅            | Upload HLS video                   |
| **Likes**     | POST      | `/likes`                        | ✅            | Like a tweet                       |
| **Likes**     | DELETE    | `/likes/:tweet_id`              | ✅            | Unlike a tweet                     |
| **Bookmarks** | POST      | `/bookmarks`                    | ✅            | Bookmark a tweet                   |
| **Bookmarks** | DELETE    | `/bookmarks/:tweet_id`          | ✅            | Remove bookmark                    |
| **Bookmarks** | GET       | `/bookmarks`                    | ✅            | Get user bookmarks                 |
| **Search**    | GET       | `/search`                       | ⚠️            | Search tweets (optional auth)      |
| **Chat**      | WebSocket | `/`                             | ✅            | Real-time messaging                |

**Legend:**

- ✅ = Authentication required
- ❌ = No authentication required
- ⚠️ = Optional authentication (different behavior)

### 5.2 Request/Response Examples

#### Example: Create Tweet

**Request:**

```http
POST /tweets HTTP/1.1
Host: localhost:8386
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": 0,
  "audience": 0,
  "content": "Hello Twitter! #firsttweet",
  "parent_id": null,
  "hashtags": [],
  "mentions": [],
  "medias": [
    {
      "url": "https://s3.amazonaws.com/bucket/image.jpg",
      "type": 0
    }
  ]
}
```

**Response:**

```json
{
  "message": "Tweet created successfully",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "type": 0,
    "audience": 0,
    "content": "Hello Twitter! #firsttweet",
    "medias": [
      {
        "url": "https://s3.amazonaws.com/bucket/image.jpg",
        "type": 0
      }
    ],
    "hashtags": ["507f1f77bcf86cd799439013"],
    "mentions": [],
    "guest_views": 0,
    "user_views": 0,
    "created_at": "2026-02-13T14:30:00.000Z",
    "updated_at": "2026-02-13T14:30:00.000Z"
  }
}
```

---

## 6. Security Design

### 6.1 Authentication Mechanism

#### JWT Token Strategy

**Access Token:**

- **Lifetime:** 15 minutes
- **Purpose:** API authorization
- **Storage:** Client memory (not localStorage)
- **Payload:**
  ```json
  {
    "user_id": "507f1f77bcf86cd799439011",
    "token_type": "AccessToken",
    "verify": 1,
    "iat": 1707835800,
    "exp": 1707836700
  }
  ```

**Refresh Token:**

- **Lifetime:** 7 days
- **Purpose:** Renew access token
- **Storage:** Redis + Client (httpOnly cookie recommended)
- **Payload:**
  ```json
  {
    "user_id": "507f1f77bcf86cd799439011",
    "token_type": "RefreshToken",
    "iat": 1707835800,
    "exp": 1708440600
  }
  ```

### 6.2 Security Measures

| Layer             | Security Measure | Implementation                             |
| ----------------- | ---------------- | ------------------------------------------ |
| **Password**      | Hashing          | bcrypt with salt rounds: 10                |
| **Token**         | Signing          | JWT with HS256 algorithm                   |
| **Token Storage** | Refresh Token    | Redis with TTL                             |
| **API**           | Rate Limiting    | Express rate-limit middleware              |
| **Input**         | Validation       | express-validator                          |
| **Input**         | Sanitization     | Remove HTML tags, SQL injection prevention |
| **CORS**          | Cross-Origin     | Configured allowed origins                 |
| **Headers**       | Security Headers | Helmet.js middleware                       |
| **File Upload**   | Validation       | File type, size, extension checks          |
| **OAuth**         | Google OAuth 2.0 | Secure token exchange                      |

### 6.3 Authorization Levels

```mermaid
flowchart TB
    Request[Incoming Request]
    Auth{Has Access Token?}
    Verify{Token Valid?}
    UserStatus{User Verified?}
    Resource{Resource Access?}

    Request --> Auth
    Auth -->|No| Public[Public Access Only]
    Auth -->|Yes| Verify
    Verify -->|Invalid| Reject401[401 Unauthorized]
    Verify -->|Valid| UserStatus
    UserStatus -->|Unverified| Reject403[403 Forbidden]
    UserStatus -->|Verified| Resource
    Resource -->|Allowed| Process[Process Request]
    Resource -->|Denied| Reject403

    style Public fill:#e8f5e9
    style Process fill:#c8e6c9
    style Reject401 fill:#ffcdd2
    style Reject403 fill:#ffcdd2
```

---

## 7. Performance Optimization

### 7.1 Database Optimization

#### Aggregation Pipeline Example (News Feed)

```javascript
db.tweets.aggregate([
  // Stage 1: Match tweets from followed users
  {
    $match: {
      user_id: { $in: followedUserIds },
      audience: { $in: [0, 1] }, // Public or Circle
    },
  },

  // Stage 2: Lookup user information
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user",
    },
  },

  // Stage 3: Unwind user array
  { $unwind: "$user" },

  // Stage 4: Lookup like count
  {
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "tweet_id",
      as: "likes",
    },
  },

  // Stage 5: Add computed fields
  {
    $addFields: {
      like_count: { $size: "$likes" },
      is_liked: {
        $in: [currentUserId, "$likes.user_id"],
      },
    },
  },

  // Stage 6: Sort by date
  { $sort: { created_at: -1 } },

  // Stage 7: Pagination
  { $skip: (page - 1) * limit },
  { $limit: limit },

  // Stage 8: Project final fields
  {
    $project: {
      likes: 0,
      "user.password": 0,
      "user.email_verify_token": 0,
      "user.forgot_password_token": 0,
    },
  },
]);
```

### 7.2 Caching Strategy

#### Redis Cache Implementation

```javascript
// Cache key patterns
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:${userId}`,
  NEWS_FEED: (userId, page) => `feed:${userId}:${page}`,
  TWEET_DETAIL: (tweetId) => `tweet:${tweetId}`,
  SEARCH_RESULTS: (query, page) => `search:${query}:${page}`,
};

// Cache TTL (Time To Live)
const CACHE_TTL = {
  USER_PROFILE: 3600, // 1 hour
  NEWS_FEED: 300, // 5 minutes
  TWEET_DETAIL: 600, // 10 minutes
  SEARCH_RESULTS: 600, // 10 minutes
};
```

#### Cache Invalidation Strategy

```mermaid
flowchart LR
    Event[Data Change Event]
    Invalidate{Invalidation Type}

    Event --> Invalidate
    Invalidate -->|User Update| InvalidateUser[Clear user:* cache]
    Invalidate -->|New Tweet| InvalidateFeed[Clear feed:* cache]
    Invalidate -->|Like/Unlike| InvalidateTweet[Clear tweet:* cache]
    Invalidate -->|New Comment| InvalidateTweetAndFeed[Clear tweet:* and feed:*]

    style Event fill:#e3f2fd
    style InvalidateUser fill:#fff3e0
    style InvalidateFeed fill:#fff3e0
    style InvalidateTweet fill:#fff3e0
    style InvalidateTweetAndFeed fill:#fff3e0
```

### 7.3 Media Optimization

#### Image Processing Pipeline

```javascript
// Sharp configuration
const imageOptimization = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 80,
  format: 'jpeg',
  progressive: true
}

// Processing steps
1. Validate file (type, size)
2. Resize if dimensions > 2048px
3. Convert to JPEG
4. Compress with quality: 80%
5. Generate progressive JPEG
6. Upload to S3
7. Return optimized URL
```

#### Video HLS Encoding

```bash
# FFmpeg HLS encoding command
ffmpeg -i input.mp4 \
  -profile:v baseline \
  -level 3.0 \
  -start_number 0 \
  -hls_time 10 \
  -hls_list_size 0 \
  -f hls \
  -hls_segment_filename "segment_%03d.ts" \
  -master_pl_name "master.m3u8" \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" \
  output_%v.m3u8

# Quality variants
- 1080p: 5000k bitrate
- 720p:  2800k bitrate
- 480p:  1400k bitrate
- 360p:  800k bitrate
```

---

## 8. Real-Time Communication

### 8.1 Socket.IO Events

#### Client → Server Events

| Event                | Payload                  | Description             |
| -------------------- | ------------------------ | ----------------------- |
| `send_message`       | `{receiver_id, content}` | Send a message          |
| `typing_start`       | `{receiver_id}`          | User starts typing      |
| `typing_stop`        | `{receiver_id}`          | User stops typing       |
| `message_read`       | `{message_id}`           | Mark message as read    |
| `join_conversation`  | `{conversation_id}`      | Join conversation room  |
| `leave_conversation` | `{conversation_id}`      | Leave conversation room |

#### Server → Client Events

| Event                 | Payload               | Description               |
| --------------------- | --------------------- | ------------------------- |
| `connected`           | `{user_id}`           | Connection established    |
| `receive_message`     | `{message, sender}`   | New message received      |
| `message_sent`        | `{message}`           | Message sent confirmation |
| `user_typing`         | `{user_id, username}` | User is typing            |
| `user_stopped_typing` | `{user_id}`           | User stopped typing       |
| `user_online`         | `{user_id}`           | User came online          |
| `user_offline`        | `{user_id}`           | User went offline         |
| `new_like`            | `{user, tweet}`       | Someone liked your tweet  |
| `new_follower`        | `{user}`              | New follower notification |

### 8.2 Connection Management

```javascript
// Socket connection pool structure
const connections = new Map();
// Key: user_id
// Value: socket_id

// Online user tracking
const onlineUsers = new Set();

// Room management
const conversationRooms = new Map();
// Key: conversation_id
// Value: Set of socket_ids
```

---

## 9. Error Handling

### 9.1 Error Response Format

```json
{
  "message": "Error message",
  "errors": {
    "field_name": {
      "msg": "Validation error message",
      "value": "invalid_value",
      "location": "body"
    }
  }
}
```

### 9.2 HTTP Status Codes

| Code | Meaning               | Usage                                         |
| ---- | --------------------- | --------------------------------------------- |
| 200  | OK                    | Successful request                            |
| 201  | Created               | Resource created successfully                 |
| 400  | Bad Request           | Validation error                              |
| 401  | Unauthorized          | Invalid/missing token                         |
| 403  | Forbidden             | User not verified or insufficient permissions |
| 404  | Not Found             | Resource not found                            |
| 409  | Conflict              | Resource already exists                       |
| 422  | Unprocessable Entity  | Semantic error                                |
| 500  | Internal Server Error | Server error                                  |

---

## 10. Deployment Architecture

### 10.1 Docker Compose Setup

```yaml
version: "3.8"

services:
  # Backend API
  api:
    build: ./NodeJS-TS
    ports:
      - "8386:8386"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/twitter
      - REDIS_URI=redis://redis:6379
    depends_on:
      - mongo
      - redis

  # MongoDB
  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Frontend
  frontend:
    build: ./ReatJS-TS
    ports:
      - "5173:5173"
    depends_on:
      - api

volumes:
  mongo_data:
  redis_data:
```

### 10.2 Environment Variables

```bash
# Server
PORT=8386
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/twitter
REDIS_URI=redis://localhost:6379

# JWT
JWT_SECRET_ACCESS_TOKEN=your_access_secret
JWT_SECRET_REFRESH_TOKEN=your_refresh_secret
JWT_SECRET_EMAIL_VERIFY_TOKEN=your_email_secret
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your_forgot_password_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8386/users/oauth/google/callback

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
```

---

## 11. Future Enhancements

### 11.1 Planned Features

- [ ] **Notifications System**: Push notifications for likes, comments, mentions
- [ ] **Direct Message Groups**: Multi-user chat rooms
- [ ] **Tweet Scheduling**: Schedule tweets for future posting
- [ ] **Analytics Dashboard**: User engagement metrics
- [ ] **Advanced Search**: Filters by date, user, media type
- [ ] **Trending Topics**: Real-time trending hashtags
- [ ] **User Verification Badge**: Verified user system
- [ ] **Content Moderation**: AI-powered content filtering
- [ ] **Mobile App**: React Native mobile application
- [ ] **CDN Integration**: CloudFront for media delivery

### 11.2 Scalability Considerations

```mermaid
flowchart TB
    LB[Load Balancer]

    subgraph API_Cluster[API Server Cluster]
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
    end

    subgraph DB_Cluster[Database Cluster]
        PRIMARY[(MongoDB Primary)]
        SECONDARY1[(MongoDB Secondary 1)]
        SECONDARY2[(MongoDB Secondary 2)]
    end

    subgraph Cache_Cluster[Cache Cluster]
        REDIS1[(Redis Master)]
        REDIS2[(Redis Replica)]
    end

    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> PRIMARY
    API2 --> PRIMARY
    API3 --> PRIMARY

    PRIMARY --> SECONDARY1
    PRIMARY --> SECONDARY2

    API1 --> REDIS1
    API2 --> REDIS1
    API3 --> REDIS1

    REDIS1 --> REDIS2

    style LB fill:#e1f5fe
    style API_Cluster fill:#e8f5e9
    style DB_Cluster fill:#fce4ec
    style Cache_Cluster fill:#fff3e0
```

---

## 12. Conclusion

This System Design Specification document provides a comprehensive overview of the Twitter Clone platform architecture, including:

✅ **Complete system architecture** with layered design  
✅ **Detailed flow diagrams** for all major features  
✅ **Database schema** with optimized indexes  
✅ **API specifications** with examples  
✅ **Security mechanisms** including JWT and OAuth  
✅ **Performance optimization** strategies  
✅ **Real-time communication** design  
✅ **Deployment architecture** with Docker

This document serves as the technical blueprint for development, maintenance, and future enhancements of the platform.

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-13  
**Maintained By:** Development Team
