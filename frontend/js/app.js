// 首页逻辑：加载城市、查询班次、下单。

let selectedSchedule = null;

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
  wrap.innerHTML = "";
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

// 查询班次。
async function doSearch(e) {
  if (e) {
    e.preventDefault();
  }
  const params = {};
  const from = document.getElementById("fromCity").value;
  const to = document.getElementById("toCity").value;
  const date = document.getElementById("departDate").value;
  if (from) {
    params.from = from;
  }
  if (to) {
    params.to = to;
  }
  if (date) {
    params.date = date;
  }
  try {
    const list = await API.searchSchedules(params);
    renderResults(list);
  } catch (err) {
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
  document.getElementById("bookModal").style.display = "flex";
}

// 提交订单。
async function submitOrder() {
  const passengerName = document.getElementById("passengerName").value.trim();
  const seatCount = parseInt(document.getElementById("seatCount").value, 10);
  if (!passengerName) {
    toast("请填写乘车人姓名", "error");
    return;
  }
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
});
