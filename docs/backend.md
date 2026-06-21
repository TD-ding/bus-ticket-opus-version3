# 后端文档

汽车票订购网站后端，基于 Node.js + Express，使用 JWT 认证与轻量 JSON 文件存储。

## 技术栈

- Node.js 18 + Express 4
- 认证：jsonwebtoken（JWT）+ bcryptjs（密码哈希）
- 存储：本地 JSON 文件（`backend/src/data/db.json`，可用 `DATA_FILE` 覆盖）

## 目录结构

```
backend/src/
├── server.js          # 应用入口，装配中间件与路由，含默认管理员初始化
├── constants.js       # 全局常量（JWT 密钥、角色、订单状态等）
├── db.js              # JSON 文件存储：load / save / reset
├── utils.js           # 共享工具（withRemaining 余票计算）
├── middleware/auth.js # authRequired / adminRequired 鉴权中间件
└── routes/
    ├── auth.js        # 注册 / 登录
    ├── schedules.js   # 班次查询
    ├── orders.js      # 下单 / 我的订单 / 退票
    └── admin.js       # 管理员：统计 / 班次CRUD / 订单总览
```

## 数据模型

### User
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 用户 ID（`U-` 前缀） |
| username | string | 用户名（唯一） |
| password | string | bcrypt 哈希 |
| role | string | `user` / `admin` |

### Schedule（班次）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 班次编号（`B` 前缀） |
| from / to | string | 出发 / 到达城市 |
| departDate | string | 出发日期 YYYY-MM-DD |
| departTime / arriveTime | string | 发车 / 到达时间 HH:mm |
| busType | string | 车型 |
| price | number | 票价 |
| totalSeats / soldSeats | number | 总座位 / 已售 |
| remainingSeats | number | 响应中附加的余票（= total - sold） |

### Order（订单）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 订单号（`O-` 前缀） |
| userId | string | 下单用户 |
| scheduleId | string | 关联班次 |
| from / to / departDate / departTime / busType | - | 下单时快照 |
| passengerName | string | 乘车人 |
| seatCount | number | 购票数量（1-5） |
| totalPrice | number | 总价 |
| status | string | `paid` / `cancelled` |
| createdAt | string | ISO 时间 |

## API 端点

所有响应均为 JSON。错误统一返回 `{ "error": "<消息>" }`。

### 认证 `/api/auth`
| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/register` | 否 | 注册，body: `{username, password}`，密码≥6 位 |
| POST | `/login` | 否 | 登录，返回 `{token, user}` |

### 班次 `/api/schedules`
| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/` | 否 | 查询班次，query: `from` `to` `date` 可选 |
| GET | `/cities` | 否 | 城市列表（去重） |
| GET | `/:id` | 否 | 班次详情 |

### 订单 `/api/orders`（均需登录）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 下单，body: `{scheduleId, passengerName, seatCount}` |
| GET | `/` | 当前用户订单列表 |
| POST | `/:id/cancel` | 退票（归还座位） |

### 管理 `/api/admin`（均需管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats` | 概览统计（班次/用户/订单/营收） |
| GET | `/schedules` | 全部班次 |
| POST | `/schedules` | 新增班次 |
| PUT | `/schedules/:id` | 修改班次 |
| DELETE | `/schedules/:id` | 删除班次（有有效订单则拒绝） |
| GET | `/orders` | 全部订单 |

### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查，返回 `{status:"ok"}` |

## 鉴权

- 登录/注册成功返回 JWT，前端在后续请求头携带 `Authorization: Bearer <token>`
- `authRequired` 校验 token 有效性；`adminRequired` 进一步要求 `role === admin`
- Token 有效期 12 小时（见 `constants.js`）

## 校验规则

- 注册：用户名非空、唯一；密码≥6 位
- 下单：班次存在、余票充足、数量 1-5
- 退票：仅本人且未取消的订单
- 班次新增/编辑：信息完整、出发≠到达、票价非负、总座位≥已售

## 错误格式

| 状态码 | 含义 |
|--------|------|
| 400 | 参数校验失败 |
| 401 | 未登录 / 凭证无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 冲突（用户名已存在 / 余票不足 / 班次有订单） |
| 500 | 服务器内部错误 |

## 环境变量

见 `.env.example`：`PORT` `JWT_SECRET` `ADMIN_USERNAME` `ADMIN_PASSWORD` `DATA_FILE`。

## 测试

```bash
cd backend && npm test
```

使用 jest + supertest，覆盖认证、班次、订单、权限，共 14 个用例。
