// Optional platform features: an AI one-liner (window.xhs.AI) and the rooftop height leaderboard
// (client 9.51+). Both are in closed beta, so every failure degrades to a short message.
const RANK_MIN_CLIENT_VERSION = 9510;
const BOARD = { board: 1, period: 'all' };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function aiAvailable(xhs) {
  return !!(xhs && xhs.AI && typeof xhs.AI.createModel === 'function');
}

// Resolves to the model's one-line comment; rejects with a user-facing message.
export async function roast(xhs, price, list) {
  const lines = list.slice(0, 12).map(p => p.label + '：' + p.buy.toFixed(2) + ' 元/克买入，' +
    (p.floors ? '亏 ' + (-p.pct).toFixed(1) + '%，站在 ' + p.floors + ' 层天台' : '赚 ' + p.pct.toFixed(1) + '%，在地面'));
  let result;
  try {
    result = await xhs.AI.createModel('deepseek-v4-flash').generateText({
      messages: [
        { role: 'system', content: '你是一个嘴毒但心善的理财段子手。根据给出的黄金买入情况写一句不超过 40 个字的调侃，只输出这一句话。要好笑，不给投资建议，不出现任何轻生、跳楼等危险内容，结尾劝大家下来吃火锅。' },
        { role: 'user', content: '现在金价 ' + price.toFixed(2) + ' 元/克。\n' + lines.join('\n') },
      ],
      max_output_tokens: 120,
      temperature: 1,
    });
  } catch (e) {
    const code = String((e && (e.errCode || e.code || e.errMsg || e.message)) || '');
    if (/NOT_ALLOWED/.test(code)) throw new Error('这个小工具还没开通 AI 能力。');
    if (/QUOTA/.test(code)) throw new Error('今天的 AI 次数用完了，明天再来。');
    if (/CONTENT_BLOCKED/.test(code)) throw new Error('这次的内容没通过审核，换个昵称再试。');
    throw new Error('AI 暂时没有回应，稍后再试。');
  }
  const choice = result && result.choices && result.choices[0];
  const text = choice && choice.message && typeof choice.message.content === 'string' ? choice.message.content.trim() : '';
  if (!text) throw new Error('AI 这次没想出词，再点一次试试。');
  return text.slice(0, 120);
}

export function rankAvailable(xhs, version) {
  const miniTool = xhs && xhs.miniTool;
  return version !== null && version >= RANK_MIN_CLIENT_VERSION && !!miniTool &&
    ['submitScore', 'getRankList', 'getMyRank'].every(name => typeof miniTool[name] === 'function');
}

// 2002 means the board cache is not ready: retry a few times instead of showing an empty board.
async function withRetry(call) {
  const delays = [500, 1000, 2000];
  for (let i = 0; ; i++) {
    try { return await call(); } catch (e) {
      if (!(e && e.errCode === 2002) || i >= delays.length) throw e;
      await wait(delays[i]);
    }
  }
}

// Submits `floors` when it is positive, then resolves to { rows: [{ rank, score, name }], mine }.
// Rejects with a user-facing message; `unauthorized` is set when the entry should be hidden.
export async function loadBoard(xhs, floors) {
  const miniTool = xhs.miniTool;
  try {
    if (floors > 0) await miniTool.submitScore({ board: BOARD.board, score: floors });
    const list = await withRetry(() => miniTool.getRankList(BOARD));
    const my = await withRetry(() => miniTool.getMyRank(BOARD));
    const rows = (list && Array.isArray(list.data) ? list.data : []).slice(0, 20)
      .map(r => ({ rank: r.rank, score: r.score, name: r.nickname || '神秘股东' }));
    const mine = !my ? '' : my.status === 'EXACT' ? '我的最高纪录：' + my.score + ' 层，第 ' + my.rank + ' 名'
      : my.status === 'OVER_LIMIT' ? '我的排名：500+' : '我还没上过天台';
    return { rows, mine };
  } catch (e) {
    const error = new Error(e && e.errCode === 1005 ? '这个小工具还没开通排行榜。' : e && e.errCode === 2002 ? '榜单还在准备，稍后再试。' : '排行榜暂时打不开，稍后再试。');
    error.unauthorized = !!(e && e.errCode === 1005);
    throw error;
  }
}
