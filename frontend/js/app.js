// 首页逻辑：加载城市、查询班次、下单。

let selectedSchedule = null;
// 缓存最近一次查询结果，供前端排序复用，避免重复请求。
let lastResults = [];

// 加载城市下拉。
async function loadCities() {
  try {
    const cities = await API.cities();
    const fromSel = document.getElementById("fromCity");
    const toSel = document.getElementById("toCity");
    cities.forEach((c) => {
      fromSel.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`);
      toSel.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`);
    });
  } catch (err) {
    toast(err.message, "error");
  }
}

// 渲染班次结果列表。
function renderResults(list) {
  const wrap = document.getElementById("resultList");
  const empty = document.getElementById("emptyHint");
  const count = document.getElementById("resultCount");
  wrap.innerHTML = "";
  count.textContent = list.length ? `共 ${list.length} 个班次` : "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  list.forEach((s) => {
    const soldOut = s.remainingSeats <= 0;
    const card = document.createElement("div");
    card.className = "schedule-card";
    card.innerHTML = `
      <div class="route">
        <span class="city">${s.from}</span>
        <span class="arrow">→</span>
        <span class="city">${s.to}</span>
      </div>
      <div class="meta">
        <span>${s.departDate} ${s.departTime} 发车</span>
        <span>${s.busType}</span>
        <span>余票 ${s.remainingSeats}/${s.totalSeats}</span>
      </div>
      <div class="action">
        <span class="price">¥${s.price}</span>
        <button class="btn-primary book-btn" ${soldOut ? "disabled" : ""}>
          ${soldOut ? "已售罄" : "购票"}
        </button>
      </div>`;
    card.querySelector(".book-btn").addEventListener("click", () => openBookModal(s));
    wrap.appendChild(card);
  });
}

// 按当前排序方式对缓存结果排序并重新渲染。
function applySort() {
  const mode = document.getElementById("sortBy").value;
  const list = [...lastResults];
  if (mode === "priceAsc") {
    list.sort((a, b) => a.price - b.price);
  } else if (mode === "priceDesc") {
    list.sort((a, b) => b.price - a.price);
  } else if (mode === "timeAsc") {
    list.sort((a, b) => (a.departDate + a.departTime).localeCompare(b.departDate + b.departTime));
  }
  renderResults(list);
}

// 查询班次。
async function doSearch(e) {
  if (e) {
    e.preventDefault();
  }
  const params = {};
  const from = document.getElementById("fromCity").value;
  const to = document.getElementById("toCity").value;
  const date = document.getElementById("departDate").value;
  // 出发与到达不能是同一城市。
  if (from && to && from === to) {
    toast("出发城市和到达城市不能相同", "error");
    return;
  }
  if (from) {
    params.from = from;
  }
  if (to) {
    params.to = to;
  }
  if (date) {
    params.date = date;
  }
  // 查询期间显示加载占位，避免页面空白。
  const wrap = document.getElementById("resultList");
  const empty = document.getElementById("emptyHint");
  empty.style.display = "none";
  wrap.innerHTML = '<div class="loading">正在查询班次…</div>';
  try {
    const list = await API.searchSchedules(params);
    lastResults = list;
    applySort();
  } catch (err) {
    wrap.innerHTML = "";
    toast(err.message, "error");
  }
}

// 打开下单弹窗（需登录）。
function openBookModal(schedule) {
  if (!currentUser()) {
    toast("请先登录再购票", "error");
    openAuthModal();
    return;
  }
  selectedSchedule = schedule;
  document.getElementById("bookInfo").innerHTML = `
    <p>${schedule.from} → ${schedule.to}</p>
    <p>${schedule.departDate} ${schedule.departTime} · ${schedule.busType}</p>
    <p>单价 ¥${schedule.price}</p>`;
  document.getElementById("passengerName").value = currentUser().username;
  document.getElementById("seatCount").value = 1;
  updateTotalPreview();
  document.getElementById("bookModal").style.display = "flex";
}

// 根据单价与数量实时计算总价预览。
function updateTotalPreview() {
  if (!selectedSchedule) {
    return;
  }
  const count = parseInt(document.getElementById("seatCount").value, 10) || 0;
  document.getElementById("totalPreview").textContent =
    count > 0 ? `合计：¥${selectedSchedule.price * count}` : "";
}

// 提交订单。
async function submitOrder() {
  const passengerName = document.getElementById("passengerName").value.trim();
  const seatCount = parseInt(document.getElementById("seatCount").value, 10);
  if (!passengerName) {
    toast("请填写乘车人姓名", "error");
    return;
  }
  // 校验购票数量，避免空值或越界提交到后端。
  if (!seatCount || seatCount < 1 || seatCount > 5) {
    toast("购票数量需在 1-5 张之间", "error");
    return;
  }
  // 下单时禁用按钮，避免重复点击造成多次下单。
  const btn = document.getElementById("bookSubmit");
  btn.disabled = true;
  btn.textContent = "提交中…";
  try {
    await API.createOrder({
      scheduleId: selectedSchedule.id,
      passengerName,
      seatCount
    });
    toast("购票成功！", "success");
    document.getElementById("bookModal").style.display = "none";
    doSearch();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "确认下单";
  }
}

// 登录成功后回调（common.js 调用）。
function onAuthSuccess() {
  // 登录后无额外动作，用户可继续购票。
}

document.addEventListener("DOMContentLoaded", () => {
  loadCities();
  doSearch();
  document.getElementById("searchForm").addEventListener("submit", doSearch);
  document.getElementById("bookClose").addEventListener("click", () => {
    document.getElementById("bookModal").style.display = "none";
  });
  document.getElementById("bookSubmit").addEventListener("click", submitOrder);
  // 切换排序方式时无需重新请求，直接对缓存结果排序。
  document.getElementById("sortBy").addEventListener("change", applySort);
  // 数量变化时刷新总价预览。
  document.getElementById("seatCount").addEventListener("input", updateTotalPreview);
});
