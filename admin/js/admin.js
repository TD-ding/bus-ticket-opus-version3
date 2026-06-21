// 管理后台逻辑：登录、统计、班次 CRUD、订单总览。
// 管理端为独立单页，自带 API 封装与登录态，不依赖用户端脚本。

const API_BASE = "/api";

// 读取 / 保存管理员 token。
function adminToken() {
  return localStorage.getItem("admin_token");
}

// 统一请求方法（管理接口默认带 token）。
async function req(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (adminToken()) {
    headers.Authorization = "Bearer " + adminToken();
  }
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error((data && data.error) || "请求失败");
  }
  return data;
}

// Toast 提示。
let toastTimer = null;
function toast(msg, type = "info") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "toast";
  }, 2500);
}

// ===== 登录 =====
async function doLogin() {
  const username = document.getElementById("adminUser").value.trim();
  const password = document.getElementById("adminPass").value;
  if (!username || !password) {
    toast("请输入账号密码", "error");
    return;
  }
  try {
    const res = await req("/auth/login", { method: "POST", body: { username, password } });
    if (res.user.role !== "admin") {
      toast("该账号不是管理员", "error");
      return;
    }
    localStorage.setItem("admin_token", res.token);
    localStorage.setItem("admin_user", JSON.stringify(res.user));
    enterAdmin();
  } catch (err) {
    toast(err.message, "error");
  }
}

// 进入管理视图。
function enterAdmin() {
  const user = JSON.parse(localStorage.getItem("admin_user") || "null");
  if (!user) {
    return;
  }
  document.getElementById("loginView").style.display = "none";
  document.getElementById("adminView").style.display = "block";
  document.getElementById("adminName").textContent = user.username;
  loadStats();
  loadSchedules();
  loadOrders();
}

// 退出。
function logout() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  location.reload();
}

// ===== 统计 =====
async function loadStats() {
  try {
    const s = await req("/admin/stats");
    document.getElementById("statsBox").innerHTML = `
      <div class="stat"><span class="num">${s.scheduleCount}</span><span class="label">班次</span></div>
      <div class="stat"><span class="num">${s.userCount}</span><span class="label">用户</span></div>
      <div class="stat"><span class="num">${s.paidOrderCount}</span><span class="label">有效订单</span></div>
      <div class="stat"><span class="num">¥${s.revenue}</span><span class="label">营收</span></div>`;
  } catch (err) {
    toast(err.message, "error");
  }
}

// ===== 班次管理 =====
let editingId = null;

async function loadSchedules() {
  try {
    const list = await req("/admin/schedules");
    const body = document.getElementById("scheduleBody");
    body.innerHTML = "";
    list.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.id}</td><td>${s.from}</td><td>${s.to}</td>
        <td>${s.departDate}</td><td>${s.departTime}</td>
        <td>${s.busType}</td><td>¥${s.price}</td>
        <td>${s.remainingSeats}/${s.totalSeats}</td>
        <td class="ops">
          <button class="link-btn edit">编辑</button>
          <button class="link-btn danger del">删除</button>
        </td>`;
      tr.querySelector(".edit").addEventListener("click", () => openSchedModal(s));
      tr.querySelector(".del").addEventListener("click", () => delSchedule(s.id));
      body.appendChild(tr);
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

// 打开班次弹窗（编辑或新增）。
function openSchedModal(s) {
  editingId = s ? s.id : null;
  document.getElementById("schedTitle").textContent = s ? "编辑班次" : "新增班次";
  document.getElementById("f_from").value = s ? s.from : "";
  document.getElementById("f_to").value = s ? s.to : "";
  document.getElementById("f_date").value = s ? s.departDate : "";
  document.getElementById("f_depart").value = s ? s.departTime : "";
  document.getElementById("f_arrive").value = s ? s.arriveTime : "";
  document.getElementById("f_bus").value = s ? s.busType : "";
  document.getElementById("f_price").value = s ? s.price : "";
  document.getElementById("f_seats").value = s ? s.totalSeats : "";
  document.getElementById("scheduleModal").style.display = "flex";
}

// 保存班次。
async function saveSchedule() {
  const payload = {
    from: document.getElementById("f_from").value.trim(),
    to: document.getElementById("f_to").value.trim(),
    departDate: document.getElementById("f_date").value,
    departTime: document.getElementById("f_depart").value,
    arriveTime: document.getElementById("f_arrive").value,
    busType: document.getElementById("f_bus").value.trim(),
    price: document.getElementById("f_price").value,
    totalSeats: document.getElementById("f_seats").value
  };
  if (!payload.from || !payload.to || !payload.departDate || !payload.departTime || !payload.busType) {
    toast("请填写完整班次信息", "error");
    return;
  }
  try {
    if (editingId) {
      await req("/admin/schedules/" + editingId, { method: "PUT", body: payload });
    } else {
      await req("/admin/schedules", { method: "POST", body: payload });
    }
    toast("保存成功", "success");
    document.getElementById("scheduleModal").style.display = "none";
    loadSchedules();
    loadStats();
  } catch (err) {
    toast(err.message, "error");
  }
}

// 删除班次。
async function delSchedule(id) {
  if (!confirm("确定删除该班次？")) {
    return;
  }
  try {
    await req("/admin/schedules/" + id, { method: "DELETE" });
    toast("已删除", "success");
    loadSchedules();
    loadStats();
  } catch (err) {
    toast(err.message, "error");
  }
}

// ===== 订单总览 =====
const STATUS_TEXT = { paid: "已支付", cancelled: "已取消" };

async function loadOrders() {
  try {
    const list = await req("/admin/orders");
    const body = document.getElementById("orderBody");
    body.innerHTML = "";
    list.forEach((o) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.id}</td><td>${o.from} → ${o.to}</td>
        <td>${o.departDate} ${o.departTime}</td><td>${o.passengerName}</td>
        <td>${o.seatCount}</td><td>¥${o.totalPrice}</td>
        <td>${STATUS_TEXT[o.status] || o.status}</td>`;
      body.appendChild(tr);
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

// ===== Tab 切换 =====
function initTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById("tab-schedules").style.display = tab === "schedules" ? "block" : "none";
      document.getElementById("tab-orders").style.display = tab === "orders" ? "block" : "none";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("adminLoginBtn").addEventListener("click", doLogin);
  document.getElementById("adminLogout").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
  document.getElementById("addScheduleBtn").addEventListener("click", () => openSchedModal(null));
  document.getElementById("schedClose").addEventListener("click", () => {
    document.getElementById("scheduleModal").style.display = "none";
  });
  document.getElementById("schedSave").addEventListener("click", saveSchedule);
  initTabs();
  // 已登录则直接进入。
  if (adminToken()) {
    enterAdmin();
  }
});
