// 全局常量集中管理，避免散落在各处的魔法值。
module.exports = {
  // JWT 签名密钥，生产环境应通过环境变量注入。
  JWT_SECRET: process.env.JWT_SECRET || "bus-ticket-dev-secret",
  // Token 有效期。
  TOKEN_EXPIRES_IN: "12h",
  // bcrypt 加盐轮数。
  BCRYPT_ROUNDS: 10,
  // 用户角色枚举。
  ROLES: {
    USER: "user",
    ADMIN: "admin"
  },
  // 订单状态枚举。
  ORDER_STATUS: {
    PAID: "paid", // 已支付
    CANCELLED: "cancelled" // 已取消
  }
};
