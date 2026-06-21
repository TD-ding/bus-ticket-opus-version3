# 管理后台文档

面向管理员的后台界面，原生 HTML + CSS + JavaScript，由后端托管于 `/admin/`。

## 入口

| 文件 | 路由 | 说明 |
|------|------|------|
| `admin/index.html` | `/admin/` | 管理后台单页：登录、统计、班次管理、订单总览 |
| `admin/js/admin.js` | - | 全部管理逻辑 |
| `admin/css/admin.css` | - | 后台样式 |

## 登录

- 使用与用户端相同的 `POST /api/auth/login`，但要求返回用户 `role === admin`
- 非管理员账号登录会被拒绝（后端 `adminRequired` 中间件 + 前端二次校验）
- 默认管理员：`admin` / `admin123`（可由 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 覆盖）

## 功能模块

### 1. 统计概览
- 数据源：`GET /api/admin/stats`
- 展示班次数、用户数、订单数、总营收等 KPI 卡片

### 2. 班次管理
| 操作 | 接口 |
|------|------|
| 列表 | `GET /api/admin/schedules` |
| 新增 | `POST /api/admin/schedules` |
| 编辑 | `PUT /api/admin/schedules/:id` |
| 删除 | `DELETE /api/admin/schedules/:id` |

- 新增/编辑校验：信息完整、出发城市≠到达城市、票价非负、总座位数≥已售座位数
- 删除限制：若班次仍有有效（未取消）订单，后端拒绝删除

### 3. 订单总览
- 数据源：`GET /api/admin/orders`
- 展示全部用户订单，含状态（已支付 / 已取消）

## 数据流

```
管理员登录 → admin.js → API（携带 admin token）→ /api/admin/*
                              ↓
                后端 authRequired + adminRequired 校验
```

## 安全

- 所有 `/api/admin/*` 接口需有效 JWT 且角色为 `admin`，前端隐藏不等于安全，权限以后端为准
- 动态内容统一转义，防止 XSS
- Token 失效（401）自动登出
