# 前端文档（用户端）

面向乘客的购票界面，使用原生 HTML + CSS + JavaScript，无构建步骤，由后端静态托管于 `/`。

## 页面

| 文件 | 路由 | 说明 |
|------|------|------|
| `index.html` | `/` | 购票首页：班次查询、列表、下单 |
| `orders.html` | `/orders.html` | 我的订单：查看与退票 |

## 脚本模块

| 文件 | 职责 |
|------|------|
| `js/api.js` | API 封装。`API.request()` 统一处理 `BASE=/api`、JSON 解析、错误抛出；`auth=true` 时注入 `Authorization: Bearer <token>`，遇 401 自动清除本地登录态 |
| `js/common.js` | 通用工具：`escapeHtml`（防 XSS）、`currentUser` / `setAuth` / `logout`（登录态读写 localStorage）、`renderUserBox`、`toast` 提示、登录/注册弹窗逻辑（含密码框回车提交） |
| `js/app.js` | 首页逻辑：`loadCities` 填充城市下拉、`doSearch` 查询班次（含同城校验与加载占位）、`renderResults` 渲染结果与数量、`applySort` 按价格/时间排序、`openBookModal` / `updateTotalPreview` / `submitOrder` 下单流程 |
| `js/orders.js` | 订单页逻辑：拉取并渲染当前用户订单、退票操作 |

## 数据流

```
用户操作 → app.js/orders.js → API.request()（api.js）→ 后端 /api/*
                                   ↓
                         localStorage（token / user）
                                   ↓
                      common.js 渲染登录态与提示
```

## 关键交互

- **查询班次**：选择出发/到达城市与日期 → `GET /api/schedules` → 渲染卡片列表，支持按票价升降序、发车时间排序
- **登录/注册**：弹窗提交 → 保存 `token`、`user` 到 localStorage → 刷新右上角用户区
- **下单**：未登录先弹登录框；选座位数（1-5）实时预览总价 → `POST /api/orders` → 成功后提示并刷新余票
- **退票**：订单页点击退票 → `POST /api/orders/:id/cancel`

## 安全

- 所有动态文本经 `escapeHtml` 转义，防止 XSS
- Token 存于 localStorage，每次请求经 `api.js` 注入请求头
- 401 响应自动登出，避免使用失效凭证
- 关键校验（余票、数量、权限）后端再次强制，前端校验仅为体验优化
