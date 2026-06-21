# 🚌 畅行汽车票 (bus-ticket-opus-version3)

一个汽车票在线订购网站，包含**用户购票前端**、**Node.js 后端 API** 和**管理员后台**。

## 项目简介

- 用户可查询城市间汽车班次、注册登录、在线购票、查看与退订订单
- 管理员可登录后台管理班次（增删改查）、查看全部订单与营收统计
- 后端使用轻量 JSON 文件存储，开箱即用，无需额外数据库

## 技术栈

| 层 | 技术 |
|----|------|
| 前端（用户端 / 管理端） | 原生 HTML + CSS + JavaScript |
| 后端 | Node.js + Express |
| 认证 | JWT + bcryptjs |
| 存储 | JSON 文件（轻量持久化） |
| 代码质量 | ESLint v9 (flat config) |

## 目录结构

```
bus-ticket-opus-version3/
├── backend/                # 后端服务
│   ├── src/
│   │   ├── server.js       # 应用入口
│   │   ├── constants.js    # 全局常量
│   │   ├── db.js           # JSON 文件存储
│   │   ├── middleware/auth.js   # JWT 鉴权中间件
│   │   └── routes/         # auth / schedules / orders / admin 路由
│   ├── eslint.config.js
│   └── package.json
├── frontend/               # 用户端页面
│   ├── index.html          # 购票首页
│   ├── orders.html         # 我的订单
│   ├── css/style.css
│   └── js/                 # api / common / app / orders
├── admin/                  # 管理后台
│   ├── index.html
│   ├── css/admin.css
│   └── js/admin.js
├── .gitignore
├── .dockerignore
└── .env.example
```

## 如何运行

```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 启动服务（默认 3000 端口）
npm start
```

启动后访问：

- 用户端购票：<http://localhost:3000/>
- 管理后台：<http://localhost:3000/admin/>

默认管理员账号：`admin` / `admin123`（可通过环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 修改）。

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET  | `/api/schedules` | 查询班次（支持 from/to/date） |
| GET  | `/api/schedules/cities` | 城市列表 |
| POST | `/api/orders` | 购票下单（需登录） |
| GET  | `/api/orders` | 我的订单（需登录） |
| POST | `/api/orders/:id/cancel` | 退票（需登录） |
| GET  | `/api/admin/stats` | 统计概览（管理员） |
| CRUD | `/api/admin/schedules` | 班次管理（管理员） |
| GET  | `/api/admin/orders` | 全部订单（管理员） |

## License

MIT
