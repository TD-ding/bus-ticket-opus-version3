// 认证接口测试：注册、登录、重复注册、错误密码。
const request = require("supertest");
const path = require("path");

// 使用独立临时数据文件，避免污染开发数据。
process.env.DATA_FILE = path.join(__dirname, "tmp-auth-db.json");
const fs = require("fs");

const app = require("../src/server");
const { reset } = require("../src/db");

beforeEach(() => {
  reset();
});

afterAll(() => {
  // 清理临时数据文件。
  try {
    fs.unlinkSync(process.env.DATA_FILE);
  } catch {
    // 文件可能不存在，忽略。
    void 0;
  }
});

describe("认证接口", () => {
  it("注册成功返回 token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "tom", password: "secret1" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe("user");
  });

  it("密码过短被拒绝", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "tom", password: "123" });
    expect(res.status).toBe(400);
  });

  it("重复用户名注册返回 409", async () => {
    await request(app).post("/api/auth/register").send({ username: "tom", password: "secret1" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "tom", password: "secret1" });
    expect(res.status).toBe(409);
  });

  it("登录成功", async () => {
    await request(app).post("/api/auth/register").send({ username: "tom", password: "secret1" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "tom", password: "secret1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("错误密码登录返回 401", async () => {
    await request(app).post("/api/auth/register").send({ username: "tom", password: "secret1" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "tom", password: "wrong" });
    expect(res.status).toBe(401);
  });
});
