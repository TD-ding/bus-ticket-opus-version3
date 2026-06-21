// 应用入口：装配 Express 应用、中间件与各业务路由。
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const { load, save } = require("./db");
const { BCRYPT_ROUNDS, ROLES } = require("./constants");

const authRoutes = require("./routes/auth");
const scheduleRoutes = require("./routes/schedules");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");

const app = express();

// 跨域与 JSON 解析中间件。
app.use(cors());
app.use(express.json());

// 静态托管前端用户端与管理端页面，方便单体部署。
app.use("/", express.static(path.join(__dirname, "../../frontend")));
app.use("/admin", express.static(path.join(__dirname, "../../admin")));

// 业务路由挂载。
app.use("/api/auth", authRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// 健康检查端点，供容器与 CI 探活。
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 兜底：未匹配的 API 路径返回统一 JSON 错误。
app.use("/api", (req, res) => {
  res.status(404).json({ error: "接口不存在" });
});

// 统一错误处理中间件：捕获路由抛出的异常，返回一致的错误结构，
// 避免把堆栈细节泄露给前端。
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "服务器内部错误" });
});

// 首次启动时确保存在一个默认管理员账号，便于演示。
function ensureAdmin() {
  const db = load();
  if (!db.users.some((u) => u.role === ROLES.ADMIN)) {
    db.users.push({
      id: "U-admin",
      username: process.env.ADMIN_USERNAME || "admin",
      password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", BCRYPT_ROUNDS),
      role: ROLES.ADMIN
    });
    save();
  }
}

// 仅在直接运行时启动监听；被测试 require 时只导出 app。
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  ensureAdmin();
  app.listen(PORT, () => {
    console.log(`汽车票订购服务已启动: http://localhost:${PORT}`);
  });
}

module.exports = app;
module.exports.ensureAdmin = ensureAdmin;
