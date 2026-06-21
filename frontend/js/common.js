// 通用工具：登录态管理、顶部用户区渲染、toast 提示。

// HTML 转义：用户输入（如乘车人姓名）插入页面前必须转义，
// 避免特殊符号破坏排版或引入 XSS。
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 当前登录用户（从 localStorage 还原）。
function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// 保存登录信息。
function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// 退出登录。
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.reload();
}

// 渲染顶部用户区：未登录显示登录按钮，已登录显示用户名 + 退出。
function renderUserBox() {
  const box = document.getElementById("userBox");
  if (!box) {
    return;
  }
  const user = currentUser();
  if (user) {
    box.innerHTML = `<span class="hi">你好，${escapeHtml(user.username)}</span> <a href="#" id="logoutBtn">退出</a>`;
    const btn = document.getElementById("logoutBtn");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    box.innerHTML = `<a href="#" id="loginBtn">登录 / 注册</a>`;
    const btn = document.getElementById("loginBtn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openAuthModal();
      });
    }
  }
}

// 轻量 toast 提示。
let toastTimer = null;
function toast(msg, type = "info") {
  const el = document.getElementById("toast");
  if (!el) {
    return;
  }
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "toast";
  }, 2500);
}

// ===== 登录/注册弹窗逻辑（首页用到，订单页也可触发） =====
let authMode = "login";

function openAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) {
    location.href = "index.html";
    return;
  }
  modal.style.display = "flex";
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function initAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) {
    return;
  }
  document.getElementById("authClose").addEventListener("click", closeAuthModal);
  document.getElementById("authSwitch").addEventListener("click", (e) => {
    e.preventDefault();
    authMode = authMode === "login" ? "register" : "login";
    document.getElementById("authTitle").textContent = authMode === "login" ? "登录" : "注册";
    document.getElementById("authSubmit").textContent = authMode === "login" ? "登录" : "注册";
    document.getElementById("authSwitchText").textContent =
      authMode === "login" ? "还没有账号？" : "已有账号？";
    document.getElementById("authSwitch").textContent =
      authMode === "login" ? "去注册" : "去登录";
  });
  document.getElementById("authSubmit").addEventListener("click", submitAuth);
  // 在密码框按回车直接提交，省去点按钮。
  document.getElementById("authPassword").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitAuth();
    }
  });
}

// 提交登录/注册。
async function submitAuth() {
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  if (!username || !password) {
    toast("请输入用户名和密码", "error");
    return;
  }
  try {
    const fn = authMode === "login" ? API.login : API.register;
    const res = await fn(username, password);
    setAuth(res.token, res.user);
    toast(authMode === "login" ? "登录成功" : "注册成功", "success");
    closeAuthModal();
    renderUserBox();
    if (typeof onAuthSuccess === "function") {
      onAuthSuccess();
    }
  } catch (err) {
    toast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderUserBox();
  initAuthModal();
});
