// 班次相关的共享工具，避免在多个路由里重复计算。

// 给班次附加剩余座位字段，统一各处展示口径。
function withRemaining(s) {
  return { ...s, remainingSeats: s.totalSeats - s.soldSeats };
}

module.exports = { withRemaining };
