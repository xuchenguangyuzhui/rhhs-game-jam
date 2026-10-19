import { BLOCKS, COLORS, WORLD } from "./engine.mjs";

const FILES = [
  "paper",
  "arena-frame",
  "obstacle",
  "corner-obstacle",
  "bar-obstacle",
  "player-blue",
  "player-pink",
  "echo-blue",
  "echo-pink",
  "star",
];
export async function loadAssets() {
  const entries = await Promise.all(
    FILES.map(
      (name) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            let bounds = { x: 0, y: 0, w: image.width, h: image.height };
            if (name !== "paper") {
              const c = document.createElement("canvas");
              c.width = image.width;
              c.height = image.height;
              const ctx = c.getContext("2d", { willReadFrequently: true });
              ctx.drawImage(image, 0, 0);
              const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
              let minX = c.width,
                minY = c.height,
                maxX = 0,
                maxY = 0;
              for (let y = 0; y < c.height; y++)
                for (let x = 0; x < c.width; x++) {
                  if (pixels[(y * c.width + x) * 4 + 3] > 35) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  }
                }
              bounds = {
                x: minX,
                y: minY,
                w: maxX - minX + 1,
                h: maxY - minY + 1,
              };
            }
            resolve([name, { image, bounds }]);
          };
          image.onerror = () =>
            reject(new Error(`Could not load game artwork: ${name}`));
          image.src = `${import.meta.env.BASE_URL}assets/${name}.png`;
        }),
    ),
  );
  return Object.fromEntries(entries);
}

export class GameRenderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.assets = assets;
    this.particles = [];
    this.labels = [];
    this.afterimages = [];
    this.shake = 0;
    this.time = 0;
    this.motion = true;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(bounds.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(bounds.height * this.dpr));
  }
  sprite(name, x, y, w, h, angle = 0, alpha = 1, flip = false) {
    const asset = this.assets[name];
    if (!asset) return;
    const { image, bounds: b } = asset,
      ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(flip ? -1 : 1, 1);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(image, b.x, b.y, b.w, b.h, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  feedback(event) {
    if (event.type === "collect") {
      this.labels.push({
        x: event.x,
        y: event.y,
        text: `+${event.value}`,
        life: 0.85,
        max: 0.85,
        color: event.value === 5 ? "#a77b08" : COLORS[event.player],
      });
      const count = this.motion ? (event.value === 5 ? 20 : 10) : 0;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        this.particles.push({
          x: event.x,
          y: event.y,
          vx: Math.cos(a) * (90 + Math.random() * 130),
          vy: Math.sin(a) * 150 - 50,
          life: 0.5 + Math.random() * 0.4,
          angle: a,
          size: event.value === 5 ? 17 : 11,
        });
      }
      if (event.value === 5 && this.motion) this.shake = 2.5;
    }
    if (event.type === "hit") {
      this.labels.push({
        x: event.x,
        y: event.y - 30,
        text: "Ouch! −1",
        life: 0.9,
        max: 0.9,
        color: COLORS[event.player],
      });
      if (this.motion) this.shake = 7;
    }
    if (event.type === "dash" && this.motion) {
      this.afterimages.push({ ...event, life: 0.3, size: 72 });
    }
  }
  trail(echo, time) {
    const points = echo.track.filter(
      (p, i) =>
        (echo.track.length < 20 || i % 8 === 0) &&
        p.t <= time &&
        p.t >= Math.max(0, time - (echo.track.length < 20 ? 8 : 3)),
    );
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = COLORS[echo.player];
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.setLineDash([8, 15]);
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.lineTo(echo.x, echo.y);
    ctx.stroke();
    ctx.restore();
  }
  draw(game, dt = 1 / 60, demo = false) {
    const ctx = this.ctx;
    this.time += dt;
    ctx.setTransform(
      this.canvas.width / WORLD.width,
      0,
      0,
      this.canvas.height / WORLD.height,
      0,
      0,
    );
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    // Artwork is raster; the only programmatic marks are the players' actual recorded motion paths.
    ctx.save();
    if (this.motion && this.shake > 0.1)
      ctx.translate(
        Math.sin(this.time * 90) * this.shake,
        Math.cos(this.time * 110) * this.shake * 0.6,
      );
    this.shake *= 0.86;
    this.sprite("arena-frame", 700, 400, 1400, 800);
    for (const b of BLOCKS) {
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.scale(b.flipX ? -1 : 1, b.flipY ? -1 : 1);
      this.sprite(
        b.bar ? "bar-obstacle" : b.corner ? "corner-obstacle" : "obstacle",
        0,
        0,
        b.w,
        b.h,
      );
      ctx.restore();
    }
    for (const star of game.stars) {
      if (!star.active) continue;
      const bob = this.motion
        ? Math.sin(this.time * 2.8 + star.id * 1.7) * 3
        : 0;
      const scale = star.value === 5 ? 105 : 43;
      const pulse =
        this.motion && star.value === 5
          ? 1 + Math.sin(this.time * 3) * 0.055
          : 1;
      this.sprite(
        "star",
        star.x,
        star.y + bob,
        scale * pulse,
        scale * pulse,
        this.motion ? Math.sin(this.time + star.id) * 0.05 : 0,
      );
      if (star.value === 5 && !demo) {
        ctx.save();
        ctx.font = "700 16px Kalam";
        ctx.textAlign = "center";
        ctx.fillStyle = "#a3801b";
        ctx.fillText("+5", star.x, star.y + 68);
        ctx.restore();
      }
    }
    const echoes = game.getEchoes();
    for (const echo of echoes) {
      this.trail(echo, game.roundElapsed);
      this.sprite(
        echo.player === 0 ? "echo-blue" : "echo-pink",
        echo.x,
        echo.y,
        59,
        68,
        0,
        0.75,
        echo.facing < 0,
      );
    }
    for (const a of this.afterimages) {
      this.sprite(
        a.player === 0 ? "echo-blue" : "echo-pink",
        a.x,
        a.y,
        a.size,
        a.size * 1.15,
        0,
        a.life * 1.5,
      );
      a.life -= dt;
      a.size += dt * 50;
    }
    this.afterimages = this.afterimages.filter((a) => a.life > 0);
    for (const p of game.players) {
      const moving = p.dash > 0;
      const wobble =
        this.motion && p.stun <= 0
          ? Math.sin(this.time * (moving ? 35 : 7) + p.id) *
            (moving ? 0.12 : 0.025)
          : 0;
      if (p.dash > 0 && this.motion) {
        for (let i = 3; i >= 1; i--)
          this.sprite(
            p.id === 0 ? "echo-blue" : "echo-pink",
            p.x - p.dashX * i * 18,
            p.y - p.dashY * i * 18,
            56,
            66,
            wobble,
            0.1 * (4 - i),
            p.facing < 0,
          );
      }
      const flicker =
        p.invulnerable > 0 && !demo
          ? 0.65 + Math.sin(this.time * 30) * 0.25
          : 1;
      this.sprite(
        p.id === 0 ? "player-blue" : "player-pink",
        p.x,
        p.y,
        moving ? 68 : 59,
        moving ? 59 : 69,
        p.stun > 0 ? Math.sin(this.time * 45) * 0.2 : wobble,
        flicker,
        p.facing < 0,
      );
      ctx.save();
      ctx.fillStyle = COLORS[p.id];
      ctx.textAlign = "center";
      ctx.font = "700 26px Kalam";
      ctx.fillText(`P${p.id + 1}`, p.x, p.y - 46);
      ctx.restore();
      if (!demo && p.cooldown > 0) {
        ctx.save();
        ctx.fillStyle = COLORS[p.id];
        ctx.globalAlpha = 0.55;
        ctx.font = "700 13px Kalam";
        ctx.textAlign = "center";
        ctx.fillText(p.cooldown.toFixed(1), p.x, p.y + 49);
        ctx.restore();
      }
    }
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 160 * dt;
      particle.life -= dt;
      particle.angle += dt * 4;
      this.sprite(
        "star",
        particle.x,
        particle.y,
        particle.size,
        particle.size,
        particle.angle,
        Math.min(1, particle.life * 2),
      );
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const label of this.labels) {
      label.life -= dt;
      if (this.motion) label.y -= dt * 42;
      ctx.save();
      ctx.globalAlpha = Math.min(1, label.life * 3);
      ctx.font = "700 33px Kalam";
      ctx.textAlign = "center";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#f8f5e9";
      ctx.strokeText(label.text, label.x, label.y - 20);
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, label.x, label.y - 20);
      ctx.restore();
    }
    this.labels = this.labels.filter((l) => l.life > 0);
    ctx.restore();
  }
  dispose() {
    this.observer.disconnect();
  }
}
