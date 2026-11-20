import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTS, CHAPTERS, newGame, restoreGame, completeQuest, nearestChapter, isTimingHit, checkTeaOrder, clamp } from '../src/game.js';

test('new journeys start at Rainbow Bridge with three unfinished quests', () => {
  const state = newGame();
  assert.equal(QUESTS.length, 3);
  assert.deepEqual(state.completed, []);
  assert.deepEqual(state.visited, ['虹桥']);
  assert.equal(nearestChapter(state.camera).name, '虹桥');
  state.visited.push('街市');
  assert.deepEqual(newGame().visited, ['虹桥']);
});

test('quests award exactly one stamp and never mutate old state', () => {
  const initial = newGame();
  const next = completeQuest(initial, 'bridge');
  assert.deepEqual(initial.completed, []);
  assert.deepEqual(next.completed, ['bridge']);
  assert.equal(completeQuest(next, 'bridge'), next);
  assert.equal(completeQuest(next, 'unknown'), next);
  assert.equal(QUESTS.reduce((s, q) => completeQuest(s, q.id), next).completed.length, 3);
});

test('restores progress, position, exploration and accepted kite quest', () => {
  const state = { ...newGame(), completed: ['tea'], visited: ['虹桥', '郊野'], kiteAccepted: true, camera: .865, player: { x: .86, y: .7 } };
  assert.deepEqual(restoreGame(JSON.stringify(state)), state);
});

test('missing, malformed and incompatible saves start safely', () => {
  for (const raw of [null, undefined, '', '{broken', 'null', '[]', '{"version":999}', '42']) {
    assert.deepEqual(restoreGame(raw), newGame());
  }
});

test('untrusted save fields are filtered, deduplicated and clamped', () => {
  const raw = JSON.stringify({ version: 1, completed: ['bridge', 'bridge', 'bogus'], visited: ['fake', '街市', '街市'], player: { x: 19, y: -1 }, camera: 200, kiteAccepted: 'true' });
  const restored = restoreGame(raw);
  assert.deepEqual(restored.completed, ['bridge']);
  assert.deepEqual(restored.visited, ['虹桥', '街市']);
  assert.deepEqual(restored.player, { x: .97, y: .16 });
  assert.equal(restored.camera, .97);
  assert.equal(restored.kiteAccepted, false);
  assert.deepEqual(restoreGame('{"version":1,"completed":{},"visited":true,"player":{"x":"no","y":null},"camera":null}'), newGame());
});

test('every chapter has a reachable position and finds itself', () => {
  assert.equal(CHAPTERS.length, 5);
  for (const chapter of CHAPTERS) {
    assert.equal(nearestChapter(chapter.x).name, chapter.name);
    assert.ok(chapter.x > .03 && chapter.x < .97);
  }
  assert.equal(nearestChapter(0).name, '城阙');
  assert.equal(nearestChapter(1).name, '郊野');
});

test('boat timing accepts the complete visible safe zone only', () => {
  for (const n of [.36, .5, .64]) assert.equal(isTimingHit(n), true);
  for (const n of [0, .3599, .6401, 1, NaN]) assert.equal(isTimingHit(n), false);
});

test('tea requires exactly the remembered sequence', () => {
  assert.equal(checkTeaOrder([0, 2, 1], [0, 2, 1]), true);
  for (const actual of [[0, 1, 2], [0, 2], [0, 2, 1, 3], [0, 0, 0]]) assert.equal(checkTeaOrder([0, 2, 1], actual), false);
});

test('clamp keeps motion within the artwork', () => {
  assert.equal(clamp(-5, .03, .97), .03);
  assert.equal(clamp(5, .03, .97), .97);
  assert.equal(clamp(.5, .03, .97), .5);
});
