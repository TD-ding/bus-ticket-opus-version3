// 班次路由：查询可购买的汽车票班次。
const express = require("express");
const { load } = require("../db");

const router = express.Router();

// 查询班次，支持按出发城市、到达城市、日期过滤。
router.get("/", (req, res) => {
  const { from, to, date } = req.query;
  const db = load();
  let list = db.schedules;
  if (from) {
    list = list.filter((s) => s.from === from);
  }
  if (to) {
    list = list.filter((s) => s.to === to);
  }
  if (date) {
    list = list.filter((s) => s.departDate === date);
  }
  // 附带剩余座位数，方便前端展示。
  const result = list.map((s) => ({ ...s, remainingSeats: s.totalSeats - s.soldSeats }));
  res.json(result);
});

// 城市列表：用于前端下拉选择（去重）。
router.get("/cities", (req, res) => {
  const db = load();
  const cities = new Set();
  db.schedules.forEach((s) => {
    cities.add(s.from);
    cities.add(s.to);
  });
  res.json([...cities]);
});

// 单个班次详情。
router.get("/:id", (req, res) => {
  const db = load();
  const s = db.schedules.find((x) => x.id === req.params.id);
  if (!s) {
    return res.status(404).json({ error: "班次不存在" });
  }
  res.json({ ...s, remainingSeats: s.totalSeats - s.soldSeats });
});

module.exports = router;
