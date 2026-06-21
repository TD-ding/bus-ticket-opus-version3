// API 封装：统一处理基础路径、token 注入与错误。
const API = (() => {
  // 后端与前端同源部署，故使用相对路径。
  const BASE = "/api";

  // 读取本地保存的 token。
  function token() {
    return localStorage.getItem("token");
  }

  // 通用请求方法。
  async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && token()) {
      headers.Authorization = "Bearer " + token();
    }
    const res = await fetch(BASE + path, {
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
      // 登录态失效（token 过期）时清除本地登录信息，
      // 让页面回到未登录状态，避免反复用坏 token 请求。
      if (res.status === 401 && auth) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      throw new Error((data && data.error) || "请求失败");
    }
    return data;
  }

  return {
    token,
    register: (username, password) =>
      request("/auth/register", { method: "POST", body: { username, password } }),
    login: (username, password) =>
      request("/auth/login", { method: "POST", body: { username, password } }),
    cities: () => request("/schedules/cities"),
    searchSchedules: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request("/schedules?" + qs);
    },
    createOrder: (payload) => request("/orders", { method: "POST", body: payload, auth: true }),
    myOrders: () => request("/orders", { auth: true }),
    cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: "POST", auth: true })
  };
})();
