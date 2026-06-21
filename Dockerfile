# 后端服务镜像：基于 node:18-alpine，非 root 运行。
FROM node:18-alpine

# 工作目录
WORKDIR /app

# 先拷贝依赖清单以利用构建缓存
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev

# 拷贝后端源码与前端、管理端静态资源
COPY backend ./backend
COPY frontend ./frontend
COPY admin ./admin

# 使用非 root 用户运行
RUN addgroup -S app && adduser -S app -G app \
  && mkdir -p /app/backend/src/data && chown -R app:app /app
USER app

ENV PORT=3000
EXPOSE 3000

# 健康检查：探测 /api/health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

WORKDIR /app/backend
CMD ["node", "src/server.js"]
