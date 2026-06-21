// 管理端路由：班次的增删改查与订单总览，需管理员权限。
const express = require("express");
const { load, save } = require("../db");
const { authRequired, adminRequired } = require("../middleware/auth");
const { ROLES, ORDER_STATUS } = require("../constants");
const { withRemaining } = require("../utils");

const router = express.Router();

// 管理接口统一要求登录 + 管理员。
router.use(authRequired, adminRequired);

// 概览统计：班次数、订单数、营收。
router.get("/stats", (req, res) => {
  const db = load();
  const paidOrders = db.orders.filter((o) => o.status === ORDER_STATUS.PAID);
  const revenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  res.json({
    scheduleCount: db.schedules.length,
    userCount: db.users.filter((u) => u.role === ROLES.USER).length,
    orderCount: db.orders.length,
    paidOrderCount: paidOrders.length,
    revenue
  });
});

// 列出全部班次（含余票）。
router.get("/schedules", (req, res) => {
  const db = load();
  res.json(db.schedules.map(withRemaining));
});

// 新增班次。
router.post("/schedules", (req, res) => {
  const { from, to, departDate, departTime, arriveTime, busType, price, totalSeats } = req.body || {};
  if (!from || !to || !departDate || !departTime || !busType) {
    return res.status(400).json({ error: "班次信息不完整" });
  }
  if (from === to) {
    return res.status(400).json({ error: "出发城市和到达城市不能相同" });
  }
  const db = load();
  const schedule = {
    id: "B" + Date.now(),
    from,
    to,
    departDate,
    departTime,
    arriveTime: arriveTime || "",
    busType,
    price: Number(price) || 0,
    totalSeats: parseInt(totalSeats, 10) || 40,
    soldSeats: 0
  };
  db.schedules.push(schedule);
  save();
  res.status(201).json(schedule);
});

// 修改班次。
router.put("/schedules/:id", (req, res) => {
  const db = load();
  const schedule = db.schedules.find((s) => s.id === req.params.id);
  if (!schedule) {
    return res.status(404).json({ error: "班次不存在" });
  }
  const fields = ["from", "to", "departDate", "departTime", "arriveTime", "busType"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      schedule[f] = req.body[f];
    }
  });
  // 编辑后出发与到达也不能相同（与新增保持一致的校验）。
  if (schedule.from === schedule.to) {
    return res.status(400).json({ error: "出发城市和到达城市不能相同" });
  }
  if (req.body.price !== undefined) {
    const price = Number(req.body.price);
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ error: "票价必须为非负数" });
    }
    schedule.price = price;
  }
  if (req.body.totalSeats !== undefined) {
    const total = parseInt(req.body.totalSeats, 10) || 0;
    // 总座位不能小于已售。
    if (total < schedule.soldSeats) {
      return res.status(400).json({ error: "总座位数不能小于已售座位数" });
    }
    schedule.totalSeats = total;
  }
  save();
  res.json(schedule);
});

// 删除班次：已有订单的班次不允许删除。
router.delete("/schedules/:id", (req, res) => {
  const db = load();
  const idx = db.schedules.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "班次不存在" });
  }
  const hasOrder = db.orders.some((o) => o.scheduleId === req.params.id && o.status === ORDER_STATUS.PAID);
  if (hasOrder) {
    return res.status(409).json({ error: "该班次已有有效订单，无法删除" });
  }
  db.schedules.splice(idx, 1);
  save();
  res.json({ ok: true });
});

// 列出全部订单。
router.get("/orders", (req, res) => {
  const db = load();
  const list = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(list);
});

module.exports = router;
