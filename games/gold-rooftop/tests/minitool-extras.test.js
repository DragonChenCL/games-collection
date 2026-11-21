import test from 'node:test';
import assert from 'node:assert/strict';
import { aiAvailable, roast, rankAvailable, loadBoard } from '../minitool/extras.js';

const players = [{ label: '老王', buy: 1000, pct: -24, floors: 24 }];
const ai = generateText => ({ AI: { createModel: () => ({ generateText }) } });

test('returns the model text and explains AI failures', async () => {
  assert.equal(aiAvailable({}), false);
  let sent;
  const text = await roast(ai(async request => { sent = request; return { choices: [{ message: { content: ' 下来吃火锅 ' } }] }; }), 760, players);
  assert.equal(text, '下来吃火锅');
  assert.match(sent.messages[1].content, /老王.*24 层天台/);
  await assert.rejects(roast(ai(async () => ({ choices: [] })), 760, players), /没想出词/);
  await assert.rejects(roast(ai(async () => { throw { errMsg: 'AI_NOT_ALLOWED' }; }), 760, players), /还没开通/);
  await assert.rejects(roast(ai(async () => { throw { code: 'AI_QUOTA_EXCEEDED' }; }), 760, players), /次数用完/);
});

function board(overrides = {}) {
  const calls = [];
  const miniTool = {
    async submitScore(o) { calls.push(o.score); return { score: o.score }; },
    async getRankList() { return { data: [{ rank: 1, score: 37, nickname: null }] }; },
    async getMyRank() { return { status: 'EXACT', rank: 3, score: 24 }; },
    ...overrides,
  };
  return { xhs: { miniTool }, calls };
}

test('gates the leaderboard on client 9.51 and the three methods', () => {
  const { xhs } = board();
  assert.equal(rankAvailable(xhs, 9510), true);
  assert.equal(rankAvailable(xhs, 9500), false);
  assert.equal(rankAvailable(xhs, null), false);
  assert.equal(rankAvailable({ miniTool: { submitScore() {} } }, 9550), false);
});

test('submits positive floors only and formats the board', async () => {
  const a = board();
  assert.deepEqual(await loadBoard(a.xhs, 24), { rows: [{ rank: 1, score: 37, name: '神秘股东' }], mine: '我的最高纪录：24 层，第 3 名' });
  assert.deepEqual(a.calls, [24]);
  const b = board({ async getMyRank() { return { status: 'NOT_PARTICIPATING', rank: null, score: null }; } });
  assert.equal((await loadBoard(b.xhs, 0)).mine, '我还没上过天台');
  assert.deepEqual(b.calls, []);
});

test('flags an unauthorized leaderboard so the entry can be hidden', async () => {
  const { xhs } = board({ async submitScore() { throw { errCode: 1005 }; } });
  await assert.rejects(loadBoard(xhs, 5), e => e.unauthorized === true && /还没开通/.test(e.message));
});
