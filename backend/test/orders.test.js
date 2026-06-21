// 班次与订单接口测试：查询、下单扣座、余票不足、退票归还座位、鉴权。
const request = require("supertest");
const path = require("path");

process.env.DATA_FILE = path.join(__dirname, "tmp-orders-db.json");
const fs = require("fs");

const app = require("../src/server");
const { reset } = require("../src/db");

// 注册并返回该用户的 token。
async function registerUser(username) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "secret1" });
  return res.body.token;
}

beforeEach(() => {
  reset();
  // 重置后重新种入默认管理员，供管理接口测试登录。
  app.ensureAdmin();
});

afterAll(() => {
  try {
    fs.unlinkSync(process.env.DATA_FILE);
  } catch {
    void 0;
  }
});

describe("班次查询", () => {
  it("返回种子班次并带剩余座位", async () => {
    const res = await request(app).get("/api/schedules");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("remainingSeats");
  });

  it("按出发城市过滤", async () => {
    const res = await request(app).get("/api/schedules").query({ from: "北京" });
    expect(res.status).toBe(200);
    expect(res.body.every((s) => s.from === "北京")).toBe(true);
  });

  it("城市列表去重返回", async () => {
    const res = await request(app).get("/api/schedules/cities");
    expect(res.status).toBe(200);
    expect(new Set(res.body).size).toBe(res.body.length);
  });
});

describe("订单接口", () => {
  it("未登录下单返回 401", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ scheduleId: "B1001", passengerName: "张三" });
    expect(res.status).toBe(401);
  });

  it("下单成功并扣减座位", async () => {
    const token = await registerUser("buyer");
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer " + token)
      .send({ scheduleId: "B1001", passengerName: "张三", seatCount: 2 });
    expect(res.status).toBe(201);
    expect(res.body.seatCount).toBe(2);
    expect(res.body.totalPrice).toBe(68 * 2);

    const schedule = await request(app).get("/api/schedules/B1001");
    expect(schedule.body.remainingSeats).toBe(38);
  });

  it("购票数量越界被拒绝", async () => {
    const token = await registerUser("buyer");
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer " + token)
      .send({ scheduleId: "B1001", passengerName: "张三", seatCount: 10 });
    expect(res.status).toBe(400);
  });

  it("退票后归还座位", async () => {
    const token = await registerUser("buyer");
    const order = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer " + token)
      .send({ scheduleId: "B1001", passengerName: "张三", seatCount: 1 });
    const cancel = await request(app)
      .post(`/api/orders/${order.body.id}/cancel`)
      .set("Authorization", "Bearer " + token);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe("cancelled");

    const schedule = await request(app).get("/api/schedules/B1001");
    expect(schedule.body.remainingSeats).toBe(40);
  });
});

describe("管理接口权限", () => {
  it("普通用户访问管理接口返回 403", async () => {
    const token = await registerUser("normal");
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", "Bearer " + token);
    expect(res.status).toBe(403);
  });

  it("管理员可新增班次，同城被拒绝", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });
    const token = login.body.token;
    const bad = await request(app)
      .post("/api/admin/schedules")
      .set("Authorization", "Bearer " + token)
      .send({ from: "北京", to: "北京", departDate: "2026-07-01", departTime: "08:00", busType: "大巴" });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post("/api/admin/schedules")
      .set("Authorization", "Bearer " + token)
      .send({ from: "北京", to: "济南", departDate: "2026-07-01", departTime: "08:00", busType: "大巴", price: 120, totalSeats: 30 });
    expect(ok.status).toBe(201);
  });
});
