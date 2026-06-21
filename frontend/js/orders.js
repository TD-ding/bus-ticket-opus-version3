// 订单页逻辑：加载并展示当前用户订单，支持退票。

// 订单状态中文映射。
const STATUS_TEXT = {
  paid: "已支付",
  cancelled: "已取消"
};

// 加载订单列表。
async function loadOrders() {
  if (!currentUser()) {
    toast("请先登录查看订单", "error");
    openAuthModal();
    return;
  }
  try {
    const list = await API.myOrders();
    renderOrders(list);
  } catch (err) {
    toast(err.message, "error");
  }
}

// 渲染订单卡片。
function renderOrders(list) {
  const wrap = document.getElementById("orderList");
  const empty = document.getElementById("orderEmpty");
  wrap.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  list.forEach((o) => {
    const card = document.createElement("div");
    card.className = "order-card status-" + o.status;
    card.innerHTML = `
      <div class="order-head">
        <span class="route">${o.from} → ${o.to}</span>
        <span class="status">${STATUS_TEXT[o.status] || o.status}</span>
      </div>
      <div class="order-meta">
        <span>${o.departDate} ${o.departTime}</span>
        <span>${o.busType}</span>
        <span>乘车人：${escapeHtml(o.passengerName)}</span>
        <span>${o.seatCount} 张 · ¥${o.totalPrice}</span>
      </div>
      <div class="order-action"></div>`;
    if (o.status === "paid") {
      const btn = document.createElement("button");
      btn.className = "btn-danger";
      btn.textContent = "退票";
      btn.addEventListener("click", () => cancelOrder(o.id));
      card.querySelector(".order-action").appendChild(btn);
    }
    wrap.appendChild(card);
  });
}

// 退票。
async function cancelOrder(id) {
  try {
    await API.cancelOrder(id);
    toast("已退票", "success");
    loadOrders();
  } catch (err) {
    toast(err.message, "error");
  }
}

// 登录成功回调：刷新订单。
function onAuthSuccess() {
  loadOrders();
}

document.addEventListener("DOMContentLoaded", loadOrders);
