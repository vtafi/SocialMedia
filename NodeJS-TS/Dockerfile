# ============================================================
# Stage 1: Builder - Cài dependencies và build TypeScript
# ============================================================
FROM node:20-alpine AS builder

# Cài build tools cần thiết cho native modules (sharp, bcrypt, ...)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# --- Tận dụng Docker layer cache ---
# Copy package files TRƯỚC để Docker cache lại bước npm install.
# Nếu source code thay đổi nhưng package.json không đổi -> bỏ qua bước install.
COPY package*.json ./

# Dùng npm ci (thay vì npm install) để đảm bảo cài đúng phiên bản từ package-lock.json
# Bao gồm cả devDependencies vì cần TypeScript để build
RUN npm ci

# Copy toàn bộ source code (đã được lọc bởi .dockerignore)
COPY . .

# Biên dịch TypeScript -> JavaScript vào thư mục dist/
RUN npm run build


# ============================================================
# Stage 2: Production Runtime - Image nhỏ gọn, chỉ chứa những gì cần thiết
# ============================================================
FROM node:20-alpine

# dumb-init: xử lý tín hiệu OS đúng cách (SIGTERM) cho graceful shutdown
# ffmpeg: xử lý media nếu cần
RUN apk add --no-cache dumb-init ffmpeg

WORKDIR /usr/src/app

# Copy package files để install production dependencies
COPY package*.json ./

# Chỉ cài production dependencies (bỏ devDependencies để giảm kích thước image)
RUN npm ci --omit=dev && npm cache clean --force

# Copy code đã build từ stage builder
COPY --from=builder /usr/src/app/dist ./dist

# Copy file YAML tài liệu API (được dùng trong runtime)
COPY --from=builder /usr/src/app/API_DOCUMENT.yaml ./

# Tạo thư mục uploads để lưu file tạm (quyền ghi sẽ được gán cho user nodejs)
RUN mkdir -p uploads

# --- Bảo mật: Chạy app bằng user KHÔNG có quyền root ---
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

# Expose cổng app đang lắng nghe (PORT được set trong file .env)
EXPOSE 8386

# Health check: Gọi endpoint /health mỗi 30s để Docker biết container còn sống
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8386/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# dumb-init làm PID 1 để forward signals đúng cách -> graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Lệnh khởi chạy app trong production mode
CMD ["node", "dist/index.js", "--production"]
