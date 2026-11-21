import test from 'node:test';
import assert from 'node:assert/strict';
import { KEY, clientVersion, openStore } from '../minitool/store.js';

function container(buildVersion, saved = {}, broken = {}) {
  return {
    launchOptions: { miniToolEnv: { buildVersion } },
    miniTool: {
      async getStorage({ key }) { if (broken.read) throw { errMsg: 'getStorage:fail' }; return { data: key in saved ? saved[key] : null }; },
      async setStorage({ key, data }) { if (broken.write) throw { errMsg: 'setStorage:fail' }; saved[key] = data; return { errMsg: 'setStorage:ok' }; },
      async getStorageInfo() { return { keys: Object.keys(saved) }; },
    },
  };
}

test('reads the client version and ignores the build sequence', async () => {
  assert.equal(await clientVersion(container(9462004)), 9462);
  assert.equal(await clientVersion({}), null);
  assert.equal(await clientVersion({ miniTool: { getLaunchOptions: async () => ({ miniToolEnv: { buildVersion: '9533001' } }) } }), 9533);
});

test('round-trips data through the container storage', async () => {
  const store = await openStore(container(9530001));
  assert.equal(store.reason, '');
  assert.deepEqual(await store.read(), { state: 'empty' });
  assert.equal(await store.write({ players: [] }), true);
  assert.deepEqual(await store.read(), { state: 'ok', data: { players: [] } });
});

test('refuses to save without a known, new enough client', async () => {
  for (const [xhs, reason] of [[undefined, 'unknown'], [{}, 'unknown'], [container(9450001), 'old']]) {
    const store = await openStore(xhs);
    assert.equal(store.reason, reason);
    assert.equal(await store.write({}), false);
    assert.deepEqual(await store.read(), { state: 'failed' });
  }
});

test('tells a failed read from an empty one, and reports failed writes', async () => {
  assert.deepEqual(await (await openStore(container(9530001, { [KEY]: '{}' }, { read: true }))).read(), { state: 'failed' });
  assert.deepEqual(await (await openStore(container(9530001, {}, { read: true }))).read(), { state: 'empty' });
  assert.deepEqual(await (await openStore(container(9530001, { [KEY]: '{bad' }))).read(), { state: 'failed' });
  assert.equal(await (await openStore(container(9530001, {}, { write: true }))).write({}), false);
});
