// 认证路由：注册与登录，签发 JWT。
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { load, save } = require("../db");
const { JWT_SECRET, TOKEN_EXPIRES_IN, BCRYPT_ROUNDS, ROLES } = require("../constants");

const router = express.Router();

// 生成登录 token。
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

// 注册：用户名唯一，密码加密存储。
router.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "密码至少 6 位" });
  }
  const db = load();
  if (db.users.some((u) => u.username === username)) {
    return res.status(409).json({ error: "用户名已存在" });
  }
  const user = {
    id: "U-" + Date.now(),
    username,
    password: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    role: ROLES.USER
  };
  db.users.push(user);
  save();
  res.status(201).json({ token: signToken(user), user: { id: user.id, username, role: user.role } });
});

// 登录：校验密码，返回 token。
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" });
  }
  const db = load();
  const user = db.users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "用户名或密码错误" });
  }
  res.json({ token: signToken(user), user: { id: user.id, username, role: user.role } });
});

module.exports = router;
