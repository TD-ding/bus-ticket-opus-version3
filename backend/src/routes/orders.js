// 订单路由：下单购票、查询我的订单、退票（取消）。
const express = require("express");
const { load, save } = require("../db");
const { authRequired } = require("../middleware/auth");
const { ORDER_STATUS } = require("../constants");

const router = express.Router();

// 所有订单接口都需要登录。
router.use(authRequired);

// 创建订单：校验班次与余票，扣减座位并生成订单。
router.post("/", (req, res) => {
  const { scheduleId, passengerName, seatCount } = req.body || {};
  const count = parseInt(seatCount, 10) || 1;
  if (!scheduleId || !passengerName) {
    return res.status(400).json({ error: "班次和乘车人不能为空" });
  }
  if (count < 1 || count > 5) {
    return res.status(400).json({ error: "购票数量需在 1-5 张之间" });
  }
  const db = load();
  const schedule = db.schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    return res.status(404).json({ error: "班次不存在" });
  }
  const remaining = schedule.totalSeats - schedule.soldSeats;
  if (remaining < count) {
    return res.status(409).json({ error: `余票不足，仅剩 ${remaining} 张` });
  }
  schedule.soldSeats += count;
  const order = {
    id: "O-" + Date.now(),
    userId: req.user.id,
    scheduleId,
    from: schedule.from,
    to: schedule.to,
    departDate: schedule.departDate,
    departTime: schedule.departTime,
    busType: schedule.busType,
    passengerName,
    seatCount: count,
    totalPrice: schedule.price * count,
    status: ORDER_STATUS.PAID,
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);
  save();
  res.status(201).json(order);
});

// 查询当前用户的订单。
router.get("/", (req, res) => {
  const db = load();
  const list = db.orders
    .filter((o) => o.userId === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(list);
});

// 退票：仅能取消本人未取消的订单，并归还座位。
router.post("/:id/cancel", (req, res) => {
  const db = load();
  const order = db.orders.find((o) => o.id === req.params.id && o.userId === req.user.id);
  if (!order) {
    return res.status(404).json({ error: "订单不存在" });
  }
  if (order.status === ORDER_STATUS.CANCELLED) {
    return res.status(400).json({ error: "订单已取消，无需重复操作" });
  }
  order.status = ORDER_STATUS.CANCELLED;
  const schedule = db.schedules.find((s) => s.id === order.scheduleId);
  if (schedule) {
    schedule.soldSeats = Math.max(0, schedule.soldSeats - order.seatCount);
  }
  save();
  res.json(order);
});

module.exports = router;
