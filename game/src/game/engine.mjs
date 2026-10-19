export const MATCH_SECONDS = 60;
export const STAR_POINTS = { normal: 1, gold: 3 };
const ROUND_SECONDS = 12;
export const WORLD = {
  width: 1400,
  height: 800,
  radius: 21,
  roundSeconds: ROUND_SECONDS,
  rounds: MATCH_SECONDS / ROUND_SECONDS,
};
export const COLORS = ["#0874ed", "#ec2389"];
export const BLOCKS = [
  { x: 520, y: 0, w: 360, h: 48, bar: true },
  { x: 520, y: 752, w: 360, h: 48, bar: true },
  { x: 110, y: 80, w: 180, h: 160, corner: true, flipX: false, flipY: false },
  { x: 1110, y: 80, w: 180, h: 160, corner: true, flipX: true, flipY: false },
  { x: 110, y: 560, w: 180, h: 160, corner: true, flipX: false, flipY: true },
  { x: 1110, y: 560, w: 180, h: 160, corner: true, flipX: true, flipY: true },
  { x: 500, y: 240, w: 100, h: 100 },
  { x: 800, y: 240, w: 100, h: 100 },
  { x: 500, y: 480, w: 100, h: 100 },
  { x: 800, y: 480, w: 100, h: 100 },
];
export const COLLIDERS = BLOCKS.flatMap((b) =>
  !b.corner
    ? [b]
    : [
        { x: b.flipX ? b.x + b.w - 54 : b.x, y: b.y, w: 54, h: b.h },
        { x: b.x, y: b.flipY ? b.y + b.h - 54 : b.y, w: b.w, h: 54 },
      ],
);
const SPAWNS = [
  { x: 180, y: 395 },
  { x: 1220, y: 395 },
];
const STAR_SPOTS = [
  [75, 345],
  [430, 115],
  [970, 105],
  [1325, 345],
  [280, 565],
  [1000, 690],
  [360, 385],
  [1040, 385],
  [700, 160],
  [700, 665],
  [75, 650],
  [1325, 650],
];
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function intersectsBlock(x, y, radius = WORLD.radius) {
  return COLLIDERS.some(
    (b) =>
      Math.hypot(x - clamp(x, b.x, b.x + b.w), y - clamp(y, b.y, b.y + b.h)) <
      radius,
  );
}

export function sampleTrack(track, time) {
  if (!track?.length) return null;
  let low = 0,
    high = track.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (track[mid].t <= time) low = mid;
    else high = mid - 1;
  }
  const a = track[low],
    b = track[Math.min(low + 1, track.length - 1)];
  const ratio = b.t === a.t ? 0 : clamp((time - a.t) / (b.t - a.t), 0, 1);
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
    dash: a.dash,
    facing: a.facing,
  };
}

export class EchoGame {
  constructor(seed = 857) {
    this.seed = seed;
    this.reset();
  }
  random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  reset() {
    this.elapsed = 0;
    this.roundElapsed = 0;
    this.round = 1;
    this.status = "playing";
    this.players = SPAWNS.map((s, id) => ({
      ...s,
      id,
      score: 0,
      facing: id === 0 ? 1 : -1,
      cooldown: 0,
      dash: 0,
      stun: 0,
      invulnerable: 1,
      dashX: 0,
      dashY: 0,
      collected: 0,
      hits: 0,
      dashes: 0,
    }));
    this.echoTracks = [];
    this.recordings = [[], []];
    this.events = [];
    this.tickCount = 0;
    this.resetStars();
    this.recordFrame();
  }
  resetStars() {
    this.stars = STAR_SPOTS.slice(0, 6).map(([x, y], id) => ({
      id,
      x,
      y,
      kind: "normal",
      value: STAR_POINTS.normal,
      readyAt: 0,
      active: true,
    }));
    this.stars.push({
      id: 6,
      x: 700,
      y: 400,
      kind: "gold",
      value: STAR_POINTS.gold,
      readyAt: 0,
      active: true,
    });
  }
  recordFrame() {
    this.players.forEach((p, i) =>
      this.recordings[i].push({
        t: this.roundElapsed,
        x: p.x,
        y: p.y,
        dash: p.dash > 0,
        facing: p.facing,
      }),
    );
  }
  move(p, dx, dy) {
    const r = WORLD.radius;
    p.x = clamp(p.x + dx, 32 + r, WORLD.width - 32 - r);
    for (const b of COLLIDERS) {
      if (
        p.y > b.y - r &&
        p.y < b.y + b.h + r &&
        p.x > b.x - r &&
        p.x < b.x + b.w + r
      ) {
        if (dx > 0) p.x = b.x - r;
        else if (dx < 0) p.x = b.x + b.w + r;
      }
    }
    p.y = clamp(p.y + dy, 30 + r, WORLD.height - 30 - r);
    for (const b of COLLIDERS) {
      if (
        p.x > b.x - r + 0.01 &&
        p.x < b.x + b.w + r - 0.01 &&
        p.y > b.y - r &&
        p.y < b.y + b.h + r
      ) {
        if (dy > 0) p.y = b.y - r;
        else if (dy < 0) p.y = b.y + b.h + r;
      }
    }
  }
  getEchoes() {
    return this.echoTracks.map((echo, index) => ({
      ...sampleTrack(echo.track, this.roundElapsed),
      player: echo.player,
      generation: echo.generation,
      id: index,
      track: echo.track,
    }));
  }
  beginRound() {
    this.recordings.forEach((track, player) =>
      this.echoTracks.push({ track, player, generation: this.round }),
    );
    this.round += 1;
    this.roundElapsed = 0;
    this.recordings = [[], []];
    this.players.forEach((p, i) =>
      Object.assign(p, SPAWNS[i], {
        dash: 0,
        cooldown: 0,
        stun: 0,
        invulnerable: 1.2,
      }),
    );
    this.resetStars();
    this.recordFrame();
    this.events.push({
      type: "rewind",
      round: this.round,
      echoes: this.echoTracks.length,
    });
  }
  step(dt, input = [{}, {}]) {
    this.events = [];
    if (this.status !== "playing" || dt <= 0) return this.events;
    dt = Math.min(dt, 1 / 30);
    this.elapsed = Math.min(MATCH_SECONDS, this.elapsed + dt);
    this.roundElapsed += dt;
    this.tickCount += 1;
    this.players.forEach((p, i) => {
      p.cooldown = Math.max(0, p.cooldown - dt);
      p.dash = Math.max(0, p.dash - dt);
      p.stun = Math.max(0, p.stun - dt);
      p.invulnerable = Math.max(0, p.invulnerable - dt);
      const control = input[i] || {};
      let mx = control.x || 0,
        my = control.y || 0;
      const magnitude = Math.hypot(mx, my);
      if (magnitude > 0) {
        mx /= magnitude;
        my /= magnitude;
        if (mx) p.facing = mx > 0 ? 1 : -1;
      }
      if (control.dash && p.cooldown <= 0 && p.stun <= 0) {
        p.dashX = magnitude ? mx : p.facing;
        p.dashY = magnitude ? my : 0;
        p.dash = 0.19;
        p.cooldown = 2.6;
        p.dashes += 1;
        this.events.push({ type: "dash", player: i, x: p.x, y: p.y });
      }
      if (p.stun <= 0) {
        const dash = p.dash > 0;
        this.move(
          p,
          (dash ? p.dashX * 760 : mx * 248) * dt,
          (dash ? p.dashY * 760 : my * 248) * dt,
        );
      }
    });
    // Both rivals have equal physical presence; pushing is resolved through the same wall checks.
    const [a, b] = this.players,
      separation = distance(a, b);
    if (separation < WORLD.radius * 2) {
      const nx = separation > 0.001 ? (a.x - b.x) / separation : -1;
      const ny = separation > 0.001 ? (a.y - b.y) / separation : 0;
      const push = (WORLD.radius * 2 - separation) / 2;
      this.move(a, nx * push, ny * push);
      this.move(b, -nx * push, -ny * push);
    }
    for (const star of this.stars) {
      if (!star.active && this.elapsed >= star.readyAt) {
        if (star.kind === "normal") {
          const used = this.stars.filter((s) => s.active && s !== star);
          const spots = STAR_SPOTS.filter(
            ([x, y]) => !used.some((s) => Math.hypot(s.x - x, s.y - y) < 30),
          );
          [star.x, star.y] =
            spots[Math.floor(this.random() * spots.length)] ||
            STAR_SPOTS[star.id];
        }
        star.active = true;
      }
      if (!star.active) continue;
      const contenders = this.players.filter(
        (p) =>
          p.stun <= 0 && distance(p, star) < (star.kind === "gold" ? 48 : 34),
      );
      if (contenders.length) {
        contenders.sort(
          (p, q) =>
            distance(p, star) - distance(q, star) ||
            (this.tickCount % 2 ? q.id - p.id : p.id - q.id),
        );
        const p = contenders[0];
        p.score += star.value;
        p.collected += 1;
        star.active = false;
        star.readyAt = this.elapsed + (star.kind === "gold" ? 6 : 3);
        this.events.push({
          type: "collect",
          player: p.id,
          value: star.value,
          kind: star.kind,
          x: star.x,
          y: star.y,
        });
      }
    }
    for (const ghost of this.getEchoes()) {
      for (const p of this.players) {
        if (
          p.dash <= 0 &&
          p.invulnerable <= 0 &&
          distance(p, ghost) < WORLD.radius * 1.6
        ) {
          p.score = Math.max(0, p.score - 1);
          p.stun = 0.5;
          p.invulnerable = 1.3;
          p.hits += 1;
          this.events.push({ type: "hit", player: p.id, x: p.x, y: p.y });
        }
      }
    }
    this.recordFrame();
    if (this.elapsed >= MATCH_SECONDS - 0.000001) {
      this.elapsed = MATCH_SECONDS;
      this.status = "finished";
      this.events.push({ type: "finish", winner: this.winner });
    } else if (this.roundElapsed >= WORLD.roundSeconds - 0.000001)
      this.beginRound();
    return this.events;
  }
  get winner() {
    return this.players[0].score === this.players[1].score
      ? null
      : this.players[0].score > this.players[1].score
        ? 0
        : 1;
  }
  snapshot() {
    return {
      status: this.status,
      round: this.round,
      elapsed: this.elapsed,
      remaining: Math.max(0, Math.ceil(MATCH_SECONDS - this.elapsed)),
      roundRemaining: Math.max(0, WORLD.roundSeconds - this.roundElapsed),
      echoes: this.echoTracks.length,
      players: this.players.map((p) => ({ ...p })),
    };
  }
}

export function referenceScene() {
  const game = new EchoGame();
  game.round = 3;
  game.roundElapsed = 8;
  game.elapsed = (game.round - 1) * WORLD.roundSeconds + game.roundElapsed;
  Object.assign(game.players[0], {
    x: 405,
    y: 260,
    score: 14,
    invulnerable: 0,
  });
  Object.assign(game.players[1], {
    x: 1055,
    y: 560,
    score: 11,
    invulnerable: 0,
  });
  const paths = [
    [
      [80, 480],
      [150, 450],
      [210, 390],
    ],
    [
      [780, 670],
      [640, 680],
      [550, 620],
    ],
    [
      [1250, 285],
      [1110, 200],
      [950, 180],
    ],
    [
      [1200, 570],
      [1270, 470],
      [1255, 360],
    ],
  ];
  game.echoTracks = paths.map((points, i) => ({
    player: i < 2 ? 0 : 1,
    generation: (i % 2) + 1,
    track: points.map(([x, y], j) => ({
      x,
      y,
      t: j * 4,
      facing: i % 2 ? -1 : 1,
    })),
  }));
  return game;
}
