// 轻量级 JSON 文件存储：把内存中的数据对象同步到磁盘，
// 适合演示用，避免引入真实数据库依赖。
const fs = require("fs");
const path = require("path");

// 数据文件路径，可通过环境变量覆盖（便于测试隔离）。
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "db.json");

let db = null;

// 默认种子数据：若磁盘上没有数据文件则用它初始化。
function seed() {
  return {
    users: [],
    // 班次：城市间的汽车票线路。
    schedules: [
      {
        id: "B1001",
        from: "北京",
        to: "天津",
        departDate: "2026-06-22",
        departTime: "08:00",
        arriveTime: "10:00",
        busType: "豪华大巴",
        price: 68,
        totalSeats: 40,
        soldSeats: 0
      },
      {
        id: "B1002",
        from: "北京",
        to: "天津",
        departDate: "2026-06-22",
        departTime: "14:30",
        arriveTime: "16:30",
        busType: "中型客车",
        price: 55,
        totalSeats: 30,
        soldSeats: 0
      },
      {
        id: "B1003",
        from: "上海",
        to: "杭州",
        departDate: "2026-06-22",
        departTime: "09:15",
        arriveTime: "11:45",
        busType: "豪华大巴",
        price: 88,
        totalSeats: 40,
        soldSeats: 0
      },
      {
        id: "B1004",
        from: "广州",
        to: "深圳",
        departDate: "2026-06-22",
        departTime: "07:30",
        arriveTime: "09:30",
        busType: "商务座",
        price: 75,
        totalSeats: 20,
        soldSeats: 0
      },
      {
        id: "B1005",
        from: "成都",
        to: "重庆",
        departDate: "2026-06-23",
        departTime: "10:00",
        arriveTime: "13:30",
        busType: "豪华大巴",
        price: 110,
        totalSeats: 40,
        soldSeats: 0
      }
    ],
    orders: []
  };
}

// 加载数据：首次访问时从磁盘读取，不存在则用种子数据并落盘。
function load() {
  if (db) {
    return db;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    db = JSON.parse(raw);
  } catch {
    db = seed();
    save();
  }
  return db;
}

// 保存：把当前内存数据写回磁盘。
function save() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// 测试辅助：重置内存与磁盘到种子状态。
function reset() {
  db = seed();
  save();
  return db;
}

module.exports = { load, save, reset };
