# 部署文档

## 前置条件

- Node.js 18+（本地运行）
- 或 Docker / Docker Compose（容器化部署）

## 一、本地运行

```bash
cd backend
npm install
npm start          # 默认监听 3000 端口
```

访问：
- 用户端：<http://localhost:3000/>
- 管理后台：<http://localhost:3000/admin/>

默认管理员账号 `admin` / `admin123`，首次启动自动创建。

## 二、环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务监听端口 |
| `JWT_SECRET` | `bus-ticket-dev-secret` | JWT 签名密钥，**生产必须修改** |
| `ADMIN_USERNAME` | `admin` | 默认管理员用户名 |
| `ADMIN_PASSWORD` | `admin123` | 默认管理员密码，**生产必须修改** |
| `DATA_FILE` | `backend/src/data/db.json` | JSON 数据文件路径 |

## 三、Docker 部署

### 单容器

```bash
docker build -t bus-ticket-opus-version3 .
docker run -d -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e ADMIN_PASSWORD=your-password \
  -v bus_data:/data -e DATA_FILE=/data/db.json \
  bus-ticket-opus-version3
```

镜像基于 `node:18-alpine`，以非 root 用户运行，内置 `/api/health` 健康检查。

### Docker Compose

```bash
docker compose up -d
```

`docker-compose.yml` 说明：
- 端口映射 `${HOST_PORT:-3000}:3000`
- 通过 `JWT_SECRET` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` 注入配置
- 数据持久化到命名卷 `bus_data`（挂载至容器 `/data`，`DATA_FILE=/data/db.json`）

可在同目录创建 `.env` 覆盖默认值，例如：

```
HOST_PORT=8080
JWT_SECRET=prod-secret
ADMIN_PASSWORD=strong-password
```

## 四、CI/CD

`.github/workflows/`：

- **ci.yml**：对指向 `main` 的 Pull Request 触发，在 `backend/` 下执行 `npm install` → ESLint → Jest
- **cd.yml**：推送到 `main` 时触发 `docker build`，验证镜像可构建

## 五、健康检查

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

## 六、数据备份

所有运行数据存于 `DATA_FILE` 指向的 JSON 文件（容器内为持久卷 `bus_data`）。备份只需复制该文件；恢复则替换后重启服务。
