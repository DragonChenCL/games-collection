export const GRAMS_PER_OUNCE = 31.1034768;
export const GOLD_URL = 'https://api.gold-api.com/price/XAU';
export const FX_URL = 'https://open.er-api.com/v6/latest/USD';
const FX_TTL = 5 * 60 * 1000;

export function cnyPerGram(usdOz, usdCny) {
  return usdOz * usdCny / GRAMS_PER_OUNCE;
}

// 亏 1% 上 1 层；只要亏了就至少站 1 层。
export function standing(buyPrice, currentPrice) {
  const pct = (currentPrice - buyPrice) / buyPrice * 100;
  return { pct, diff: currentPrice - buyPrice, floors: pct < 0 ? Math.max(1, Math.floor(-pct)) : 0 };
}

export function rank({ pct, floors }) {
  if (pct >= 10) return '人生赢家';
  if (pct >= 0) return '稳坐地面';
  if (floors <= 5) return '上来吹吹风';
  if (floors <= 15) return '风有点大';
  if (floors <= 30) return '天台常客';
  return '天台 VIP';
}

function positive(value, what) {
  if (!(typeof value === 'number' && Number.isFinite(value) && value > 0)) throw new Error(`Bad ${what}`);
  return value;
}

export function createMarket(fetchJson, now = Date.now) {
  let rate = null, rateAt = 0;
  return async function quote() {
    const gold = await fetchJson(GOLD_URL);
    const usdOz = positive(gold?.price, 'gold price');
    if (rate === null || now() - rateAt > FX_TTL) {
      const fx = await fetchJson(FX_URL);
      rate = positive(fx?.rates?.CNY, 'USD/CNY rate');
      rateAt = now();
    }
    return { usdOz, usdCny: rate, cnyGram: cnyPerGram(usdOz, rate) };
  };
}
