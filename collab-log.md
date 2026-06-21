# 协作开发日志（collab-log）

> 项目：**bus-ticket-opus-version3**（畅行汽车票）
> 模式：单 agent 内模拟「生成者 + 评审者」协作流程（未使用 A2A）
> 流程依据：collab-dev → collab-core（5 轮迭代 + 基础设施 + 文档）

---

## 总览

| 阶段 | 类型 | PR | 主要产出 |
|------|------|----|----------|
| Round 1 | feat | #1 | 初始版本（前端 + 后端 + 管理后台） |
| Round 2 | refactor | #2 | 代码质量优化 |
| Round 3 | feat | #3 | 用户体验优化 |
| Round 4 | feat | #4 | 功能增强 |
| Round 5 | fix | #5 | Bug 修复 |
| Step 4 | infra | #6 | 单元测试 + Docker + CI/CD |
| Step 5 | docs | #7 | 项目文档 + README 校准 |

分支策略：每轮从最新 `main` 新建 `agent/dev` → 提交 → PR → CI 通过后合并并删除分支。

---

## Round 1 — 初始版本（feat）

**生成者**：搭建项目骨架。
- 后端：Express + JWT + bcryptjs，JSON 文件存储；路由 auth / schedules / orders / admin；默认管理员初始化
- 前端：购票首页 + 我的订单页（原生 HTML/CSS/JS）
- 管理后台：登录、统计、班次 CRUD、订单总览
- 基础设施：ESLint v9 flat config、`.gitignore`、`.dockerignore`、`.env.example`
- 数据：5 条种子班次（北京→天津、上海→杭州、广州→深圳、成都→重庆 等）

**评审者反馈（模糊化）**：
> 我试着在搜索框里输了一些带尖括号的奇怪文字，结果页面好像把它当成网页标签去处理了，看着有点不放心；另外我从北京搜到北京，居然也能查出来车次，这显然不合理。

**评审修复**：所有动态文本经 `escapeHtml` 转义防 XSS；查询与下单增加「出发城市不能等于到达城市」的同城校验。

---

## Round 2 — 代码质量优化（refactor）

**评审者反馈（模糊化）**：
> 我翻代码的时候发现「剩余座位 = 总座位 - 已卖」这个算法在好几个地方重复写了一遍，万一以后改规则就得到处找；还有一堆像 "paid"、"user" 这样的字符串直接散落在代码里，看着容易写错。

**修复**：抽取 `utils.js` 的 `withRemaining()` 统一计算余票；新增 `constants.js`，用 `ROLES` / `ORDER_STATUS` 等常量替换散落的魔法字符串。

---

## Round 3 — 用户体验优化（feat）

**评审者反馈（模糊化）**：
> 点查询的时候页面没有任何反应，要等一下结果才出来，我一度以为没点上；登录框里打完密码想直接按回车却没用；还有下单按钮我手快多点了两下，担心会不会重复买了；退票也是一点就退，没问我一句。

**修复**：查询加载占位提示、密码框回车提交、下单按钮提交期间禁用防重复、退票二次确认。

---

## Round 4 — 功能增强（feat）

**评审者反馈（模糊化）**：
> 查出来一长串车次，我想先看便宜的或者早班的，却没法排序只能自己一条条找；而且也不知道一共查到了多少趟车；下单选了几张票，到底一共多少钱也得自己算。

**修复**：班次列表支持按票价升/降序、发车时间排序；展示查询结果数量；下单时按座位数实时预览总价。

---

## Round 5 — Bug 修复（fix）

**评审者反馈（模糊化）**：
> 我在后台改班次时，把出发和到达填成同一个城市也能存进去，还能把票价填成负数；另外有一次登录过期了，页面没反应，还一直拿着旧的登录状态请求。

**修复**：编辑班次时强制出发≠到达、票价非负校验；前端购票数量 1-5 校验；接口返回 401 时自动清除本地登录态。

---

## Step 4 — 基础设施（infra）

- **测试**：jest + supertest，覆盖认证、班次、订单、权限，共 **14 个用例**全部通过
- **Docker**：`node:18-alpine`，非 root 运行，内置 `/api/health` 健康检查；`docker-compose.yml` 数据卷持久化
- **CI**（`ci.yml`）：PR 触发 `npm install` → ESLint → Jest
- **CD**（`cd.yml`）：push main 触发 `docker build`
- 验证：因环境未装 Docker，改用生产配置在本地启动后端，`/api/health` 返回 `{"status":"ok"}`

---

## Step 5 — 文档（docs）

- `docs/frontend.md`、`docs/backend.md`、`docs/admin-frontend.md`、`docs/deployment.md`
- 校准 `README.md`：目录结构、Docker 运行、测试说明与 docs/ 保持一致

---

## 质量基线

- ESLint：全程 **0 错误**
- 测试：**14 / 14** 通过
- 每个 PR 合并前 CI 均为 SUCCESS
