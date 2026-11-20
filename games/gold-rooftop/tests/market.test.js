import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cnyPerGram, standing, rank, createMarket, GOLD_URL, FX_URL } from '../src/market.js';

test('converts dollars per ounce to yuan per gram', () => {
  assert.equal(cnyPerGram(3110.34768, 7).toFixed(2), '700.00');
});

test('one floor per percent lost, at least one floor for any loss', () => {
  assert.equal(standing(1200, 768).floors, 36);
  assert.equal(standing(800, 799.9).floors, 1);
  assert.equal(standing(800, 792).floors, 1);
  assert.equal(standing(800, 784).floors, 2);
  assert.equal(standing(1001, 980.98).floors, 2);
  assert.equal(standing(800, 800).floors, 0);
  assert.equal(standing(700, 770).floors, 0);
  assert.equal(standing(700, 770).pct.toFixed(1), '10.0');
  assert.equal(standing(1000, 768).diff, -232);
});

test('ranks follow the floor count', () => {
  const names = [700, 760, 800, 900, 1000, 1200].map(p => rank(standing(p, 770)));
  assert.deepEqual(names, ['人生赢家', '稳坐地面', '上来吹吹风', '风有点大', '天台常客', '天台 VIP']);
});

test('quote combines gold and a cached exchange rate', async () => {
  const calls = [];
  let clock = 0, gold = 3110.34768;
  const quote = createMarket(async url => {
    calls.push(url);
    return url === GOLD_URL ? { price: gold } : { rates: { CNY: 7 } };
  }, () => clock);
  assert.equal((await quote()).cnyGram.toFixed(2), '700.00');
  gold *= 2; clock = 60_000;
  assert.equal((await quote()).cnyGram.toFixed(2), '1400.00');
  assert.deepEqual(calls, [GOLD_URL, FX_URL, GOLD_URL]);
  clock = 6 * 60_000;
  await quote();
  assert.equal(calls.filter(u => u === FX_URL).length, 2);
});

test('quote rejects malformed market data', async () => {
  await assert.rejects(createMarket(async () => ({ price: '3500' }))(), /gold price/);
  await assert.rejects(createMarket(async url => (url === GOLD_URL ? { price: 3500 } : { rates: {} }))(), /rate/);
});
