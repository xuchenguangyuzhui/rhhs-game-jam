import test from "node:test";
import assert from "node:assert/strict";
import {
  EchoGame,
  WORLD,
  sampleTrack,
  intersectsBlock,
} from "../src/game/engine.mjs";

const advance = (game, seconds, controls = [{}, {}]) => {
  const events = [];
  for (let tick = 0; tick < Math.round(seconds * 60); tick++)
    events.push(...game.step(1 / 60, controls));
  return events;
};
const noStars = (game) =>
  game.stars.forEach((star) => {
    star.active = false;
    star.readyAt = 1000;
  });

test("echoes arrive at 12, 24, 36 and 48 seconds, then the match ends at 60", () => {
  const game = new EchoGame();
  game.players[0].score = 7;
  advance(game, 12 - 1 / 60);
  assert.equal(game.round, 1);
  assert.equal(game.echoTracks.length, 0);
  assert.ok(game.snapshot().roundRemaining > 0);
  const firstRewind = game.step(1 / 60);
  assert.equal(firstRewind.filter((e) => e.type === "rewind").length, 1);
  assert.equal(game.round, 2);
  assert.equal(game.echoTracks.length, 2);
  assert.equal(game.players[0].score, 7);
  assert.equal(game.players[0].x, 180);
  assert.equal(game.players[0].invulnerable, 1.2);
  assert.equal(game.snapshot().roundRemaining, 12);
  const firstTrack = game.echoTracks[0].track;
  for (const round of [3, 4, 5]) {
    const events = advance(game, 12);
    assert.equal(events.filter((e) => e.type === "rewind").length, 1);
    assert.equal(game.round, round);
    assert.equal(game.echoTracks.length, (round - 1) * 2);
    assert.equal(game.echoTracks[0].track, firstTrack);
    assert.ok(Math.abs(game.elapsed - (round - 1) * 12) < 0.000001);
  }
  assert.deepEqual(
    game.echoTracks.map((echo) => echo.generation),
    [1, 1, 2, 2, 3, 3, 4, 4],
  );
  const events = advance(game, 12);
  assert.equal(game.elapsed, 60);
  assert.equal(game.status, "finished");
  assert.equal(game.round, 5);
  assert.equal(game.echoTracks.length, 8);
  assert.equal(events.filter((e) => e.type === "rewind").length, 0);
  assert.equal(events.filter((e) => e.type === "finish").length, 1);
  const snapshot = game.snapshot();
  advance(game, 10, [{ x: 1, dash: true }, { y: 1 }]);
  assert.deepEqual(game.snapshot(), snapshot);
});

test("diagonal input has the same movement speed as cardinal input", () => {
  const a = new EchoGame(),
    b = new EchoGame();
  noStars(a);
  noStars(b);
  const start = { x: 350, y: 375 };
  Object.assign(a.players[0], start);
  Object.assign(b.players[0], start);
  advance(a, 0.25, [{ x: 1 }, {}]);
  advance(b, 0.25, [{ x: 1, y: 1 }, {}]);
  assert.ok(
    Math.abs(
      Math.hypot(a.players[0].x - start.x, a.players[0].y - start.y) -
        Math.hypot(b.players[0].x - start.x, b.players[0].y - start.y),
    ) < 0.001,
  );
});

test("arena edges and solid obstacles stop normal movement and dashes", () => {
  const game = new EchoGame();
  noStars(game);
  Object.assign(game.players[0], { x: 450, y: 285 });
  advance(game, 1, [{ x: 1, dash: true }, {}]);
  assert.ok(game.players[0].x <= 500 - WORLD.radius + 0.001);
  assert.equal(intersectsBlock(game.players[0].x, game.players[0].y), false);
  Object.assign(game.players[0], { x: 70, y: 400, cooldown: 0 });
  advance(game, 2, [{ x: -1, dash: true }, {}]);
  assert.ok(game.players[0].x >= 32 + WORLD.radius);
});

test("ordinary and gold stars score once, disappear, and respawn", () => {
  const game = new EchoGame();
  const star = game.stars[0];
  Object.assign(game.players[0], { x: star.x, y: star.y });
  const events = game.step(1 / 60);
  assert.equal(game.players[0].score, 1);
  assert.equal(star.active, false);
  assert.equal(events.filter((e) => e.type === "collect").length, 1);
  const gold = game.stars.at(-1);
  Object.assign(game.players[0], { x: gold.x, y: gold.y });
  game.step(1 / 60);
  assert.equal(game.players[0].score, 6);
  assert.equal(gold.active, false);
  Object.assign(game.players[0], { x: 350, y: 750 });
  advance(game, 3.1);
  assert.equal(star.active, true);
  assert.equal(gold.active, false);
  advance(game, 3);
  assert.equal(gold.active, true);
});

test("a pickup is awarded to only one rival even on a simultaneous contact", () => {
  const game = new EchoGame();
  const star = game.stars[0];
  Object.assign(game.players[0], { x: star.x - 20, y: star.y });
  Object.assign(game.players[1], { x: star.x + 20, y: star.y });
  game.step(1 / 60);
  assert.equal(
    game.players.reduce((sum, p) => sum + p.score, 0),
    1,
  );
});

test("echoes replay captured movement rather than chase players or collect stars", () => {
  const game = new EchoGame();
  noStars(game);
  advance(game, 2, [{ x: 1 }, {}]);
  const point = { x: game.players[0].x, y: game.players[0].y };
  advance(game, 10);
  assert.equal(game.echoTracks.length, 2);
  advance(game, 2, [{ y: -1 }, { y: 1 }]);
  const echo = game.getEchoes()[0];
  assert.ok(Math.abs(echo.x - point.x) < 0.01);
  assert.ok(Math.abs(echo.y - point.y) < 0.01);
  Object.assign(game.stars[0], { x: echo.x, y: echo.y, active: true });
  game.players.forEach((p) => Object.assign(p, { x: 700, y: 100 }));
  game.step(1 / 60);
  assert.equal(game.stars[0].active, true);
});

test("any echo, including your own, stuns and penalizes once during immunity", () => {
  const game = new EchoGame();
  noStars(game);
  const p = game.players[0];
  Object.assign(p, { x: 350, y: 375, invulnerable: 0, score: 4 });
  game.echoTracks = [0, 1].map((player) => ({
    player,
    generation: 1,
    track: [{ t: 0, x: p.x, y: p.y }],
  }));
  const events = game.step(1 / 60);
  assert.equal(p.score, 3);
  assert.equal(p.stun, 0.5);
  assert.equal(events.filter((e) => e.type === "hit").length, 1);
  advance(game, 0.8);
  assert.equal(p.score, 3);
  advance(game, 0.6);
  assert.equal(p.score, 2);
  p.score = 0;
  p.invulnerable = 0;
  game.step(1 / 60);
  assert.equal(p.score, 0);
});

test("dash grants echo immunity, costs cooldown, and cannot be immediately retriggered", () => {
  const game = new EchoGame();
  noStars(game);
  const p = game.players[0];
  Object.assign(p, { x: 350, y: 375, invulnerable: 0, score: 4 });
  game.echoTracks = [
    { player: 1, generation: 1, track: [{ t: 0, x: p.x + 13, y: p.y }] },
  ];
  game.step(1 / 60, [{ x: 1, dash: true }, {}]);
  assert.equal(p.score, 4);
  assert.equal(p.dashes, 1);
  assert.equal(p.stun, 0);
  advance(game, 0.25, [{ x: 1, dash: true }, {}]);
  assert.equal(p.dashes, 1);
  advance(game, 2.4);
  game.step(1 / 60, [{ dash: true }, {}]);
  assert.equal(p.dashes, 2);
});

test("recorded positions interpolate correctly and clamp at both ends", () => {
  const track = [
    { t: 0, x: 10, y: 10 },
    { t: 1, x: 30, y: 50 },
  ];
  assert.equal(sampleTrack(track, -1).x, 10);
  assert.equal(sampleTrack(track, 0.5).x, 20);
  assert.equal(sampleTrack(track, 0.5).y, 30);
  assert.equal(sampleTrack(track, 3).y, 50);
});

test("restarting clears scores, echoes, cooldowns, and match progress", () => {
  const game = new EchoGame();
  advance(game, 49, [{ x: 1, dash: true }, { y: 1 }]);
  game.reset();
  assert.equal(game.round, 1);
  assert.equal(game.elapsed, 0);
  assert.equal(game.echoTracks.length, 0);
  assert.ok(
    game.players.every(
      (p) => p.score === 0 && p.cooldown === 0 && p.hits === 0,
    ),
  );
  assert.equal(game.stars.filter((s) => s.active).length, 7);
});
