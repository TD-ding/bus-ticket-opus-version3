// 鉴权中间件：解析并校验请求头中的 JWT，挂载用户信息到 req.user。
const jwt = require("jsonwebtoken");
const { JWT_SECRET, ROLES } = require("../constants");

// 校验登录态：要求 Authorization: Bearer <token>。
function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "未登录或登录已过期" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "登录凭证无效" });
  }
}

// 校验管理员权限：在 authRequired 之后使用。
function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: "需要管理员权限" });
  }
  next();
}

module.exports = { authRequired, adminRequired };
