import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsOutSimpleIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  XIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import {
  EchoGame,
  referenceScene,
  WORLD,
  MATCH_SECONDS,
  STAR_POINTS,
} from "./game/engine.mjs";
import { GameRenderer, loadAssets } from "./game/renderer.mjs";
import { GameAudio } from "./game/audio.mjs";

const assets = `${import.meta.env.BASE_URL}assets/`;
const KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ShiftLeft",
  "ShiftRight",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
  "Escape",
]);
const readSetting = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved === "true";
  } catch {
    return fallback;
  }
};
const saveSetting = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* Private browser storage is optional. */
  }
};
const formatTime = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

function Key({ children }) {
  return <kbd>{children}</kbd>;
}
function Keyboard({ player }) {
  return (
    <div className={`keyboard keyboard-${player}`}>
      <span className={`player-tag color-${player}`}>P{player + 1}</span>
      {player === 0 ? (
        <div className="key-cluster">
          <div>
            <Key>W</Key>
          </div>
          <div>
            <Key>A</Key>
            <Key>S</Key>
            <Key>D</Key>
          </div>
        </div>
      ) : (
        <div className="key-cluster">
          <div>
            <Key>
              <ArrowUpIcon />
            </Key>
          </div>
          <div>
            <Key>
              <ArrowLeftIcon />
            </Key>
            <Key>
              <ArrowDownIcon />
            </Key>
            <Key>
              <ArrowRightIcon />
            </Key>
          </div>
        </div>
      )}
      <span className="key-plus">+</span>
      <Key>{player === 0 ? "SHIFT" : "ENTER"}</Key>
      <span className="control-note">Move + Dash</span>
    </div>
  );
}

function Dialog({ children, label, close, className = "", container }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector("button")?.focus();
    const trap = (event) => {
      if (event.key === "Escape" && close) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      if (event.key !== "Tab") return;
      const buttons = [
        ...ref.current.querySelectorAll('button, input, [tabindex="0"]'),
      ].filter((el) => !el.disabled);
      const first = buttons[0],
        last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    ref.current?.addEventListener("keydown", trap);
    return () => {
      ref.current?.removeEventListener("keydown", trap);
      previous?.focus?.();
    };
  }, [close]);
  return createPortal(
    <div className={`dialog-scrim ${className}`}>
      <section
        className="paper-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        ref={ref}
      >
        {close && (
          <button
            className="icon-button dialog-close"
            aria-label={`Close ${label}`}
            onClick={close}
          >
            <XIcon size={26} />
          </button>
        )}
        {children}
      </section>
    </div>,
    container || document.body,
  );
}

export function App() {
  const isReference =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).has("reference");
  const canvasRef = useRef(null),
    arenaRef = useRef(null),
    shellRef = useRef(null);
  const engineRef = useRef(isReference ? referenceScene() : new EchoGame());
  const runtime = useRef({
    mode: isReference ? "reference" : "menu",
    accumulator: 0,
    count: 3.2,
    lastCount: 3,
    rewind: 0,
    keys: new Set(),
    dash: [false, false],
  });
  const audioRef = useRef(null),
    rendererRef = useRef(null);
  const [mode, setMode] = useState(runtime.current.mode);
  const [snapshot, setSnapshot] = useState(() => engineRef.current.snapshot());
  const [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState("");
  const [count, setCount] = useState(3),
    [help, setHelp] = useState(false),
    [rewindRound, setRewindRound] = useState(2);
  const [muted, setMuted] = useState(() =>
    readSetting("echo-war-muted", false),
  );
  const [motion, setMotion] = useState(() =>
    readSetting(
      "echo-war-motion",
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  );
  const [notice, setNotice] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const changeMode = useCallback((next) => {
    runtime.current.mode = next;
    runtime.current.keys.clear();
    runtime.current.dash = [false, false];
    setMode(next);
  }, []);
  const focusArena = () =>
    requestAnimationFrame(() =>
      arenaRef.current?.focus({ preventScroll: true }),
    );

  const start = useCallback(() => {
    if (!rendererRef.current) return;
    audioRef.current?.unlock();
    engineRef.current = new EchoGame(Date.now());
    rendererRef.current.particles = [];
    rendererRef.current.labels = [];
    rendererRef.current.afterimages = [];
    runtime.current.accumulator = 0;
    runtime.current.count = 3.2;
    runtime.current.lastCount = 3;
    setCount(3);
    setHelp(false);
    setSnapshot(engineRef.current.snapshot());
    changeMode("countdown");
    audioRef.current?.play({ type: "count" });
    focusArena();
  }, [changeMode]);
  const pause = useCallback(() => {
    if (["playing", "rewind", "countdown"].includes(runtime.current.mode)) {
      runtime.current.pausedFrom = runtime.current.mode;
      changeMode("paused");
    }
  }, [changeMode]);
  const resume = useCallback(() => {
    changeMode(runtime.current.pausedFrom || "playing");
    audioRef.current?.unlock();
    focusArena();
  }, [changeMode]);
  const home = useCallback(() => {
    setHelp(false);
    engineRef.current = new EchoGame();
    setSnapshot(engineRef.current.snapshot());
    changeMode("menu");
  }, [changeMode]);
  const closeHelp = useCallback(() => setHelp(false), []);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.motion = motion;
    saveSetting("echo-war-motion", motion);
  }, [motion]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.enabled = !muted;
    saveSetting("echo-war-muted", muted);
  }, [muted]);
  useEffect(() => {
    const changed = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  useEffect(() => {
    let alive = true,
      frame,
      renderer,
      last = 0,
      lastUI = 0;
    const audio = new GameAudio();
    audio.enabled = !readSetting("echo-war-muted", false);
    audioRef.current = audio;
    const onDown = (event) => {
      const r = runtime.current;
      if (event.code === "Escape" && !event.repeat) {
        if (["playing", "rewind", "countdown"].includes(r.mode)) {
          event.preventDefault();
          pause();
        } else if (r.mode === "paused") {
          event.preventDefault();
          resume();
        }
        return;
      }
      if (
        !["playing", "countdown", "rewind"].includes(r.mode) ||
        !KEYS.has(event.code) ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      event.preventDefault();
      r.keys.add(event.code);
      if (
        !event.repeat &&
        (event.code === "ShiftLeft" || event.code === "ShiftRight")
      )
        r.dash[0] = true;
      if (!event.repeat && event.code === "Enter") r.dash[1] = true;
    };
    const onUp = (event) => runtime.current.keys.delete(event.code);
    const onBlur = () => {
      runtime.current.keys.clear();
      runtime.current.dash = [false, false];
      pause();
    };
    const onVisibility = () => {
      if (document.hidden) onBlur();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    loadAssets()
      .then((loaded) => {
        if (!alive) return;
        renderer = new GameRenderer(canvasRef.current, loaded);
        renderer.motion = readSetting(
          "echo-war-motion",
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
        rendererRef.current = renderer;
        setReady(true);
        const menuScene = referenceScene();
        const animate = (now) => {
          if (!alive) return;
          const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
          last = now;
          const r = runtime.current,
            game = engineRef.current;
          if (r.mode === "countdown") {
            r.count -= dt;
            const next = Math.max(0, Math.ceil(r.count));
            if (next !== r.lastCount) {
              r.lastCount = next;
              setCount(next);
              audio.play({ type: next === 0 ? "go" : "count" });
            }
            if (r.count < -0.45) {
              changeMode("playing");
              r.accumulator = 0;
            }
          } else if (r.mode === "rewind") {
            r.rewind -= dt;
            if (r.rewind <= 0) changeMode("playing");
          } else if (r.mode === "playing") {
            r.accumulator += dt;
            while (r.accumulator >= 1 / 60 && r.mode === "playing") {
              const key = (code) => (r.keys.has(code) ? 1 : 0);
              const controls = [
                {
                  x: key("KeyD") - key("KeyA"),
                  y: key("KeyS") - key("KeyW"),
                  dash: r.dash[0],
                },
                {
                  x: key("ArrowRight") - key("ArrowLeft"),
                  y: key("ArrowDown") - key("ArrowUp"),
                  dash: r.dash[1],
                },
              ];
              r.dash = [false, false];
              const events = game.step(1 / 60, controls);
              r.accumulator -= 1 / 60;
              for (const event of events) {
                renderer.feedback(event);
                audio.play(event);
                if (event.type === "rewind") {
                  r.rewind = 1.15;
                  setRewindRound(event.round);
                  changeMode("rewind");
                }
                if (event.type === "finish") {
                  setSnapshot(game.snapshot());
                  changeMode("results");
                }
              }
            }
          }
          renderer.draw(
            r.mode === "menu" ? menuScene : game,
            dt,
            ["menu", "reference"].includes(r.mode),
          );
          if (now - lastUI > 70) {
            setSnapshot(game.snapshot());
            lastUI = now;
          }
          frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
      })
      .catch((error) => {
        if (alive) setLoadError(error.message);
      });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      renderer?.dispose();
      audio.dispose();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      rendererRef.current = null;
    };
  }, [changeMode, pause, resume]);

  const toggleSound = () => {
    audioRef.current?.unlock();
    setMuted((value) => !value);
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current.requestFullscreen();
    } catch {
      setNotice("Fullscreen is unavailable in this browser.");
      setTimeout(() => setNotice(""), 3500);
    }
  };
  const inMatch = [
    "playing",
    "paused",
    "rewind",
    "countdown",
    "reference",
  ].includes(mode);
  const winner =
    snapshot.players[0].score === snapshot.players[1].score
      ? null
      : snapshot.players[0].score > snapshot.players[1].score
        ? 0
        : 1;
  const score = (id) =>
    mode === "menu"
      ? "00"
      : String(snapshot.players[id].score).padStart(2, "0");
  const modalOpen = help || mode === "paused" || mode === "results";
  useEffect(() => {
    if (!modalOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [modalOpen]);

  return (
    <main
      className={`game-app ${motion ? "" : "reduce-motion"}`}
      ref={shellRef}
      data-mode={mode}
      data-modal-open={modalOpen}
    >
      <div className="game-shell" inert={modalOpen ? true : undefined}>
        <header className="game-header">
          <button
            className="brand"
            onClick={() => {
              if (inMatch && mode !== "reference") pause();
              else home();
            }}
            aria-label={inMatch ? "Pause Echo War" : "Echo War home"}
          >
            <img src={`${assets}logo.png`} alt="ECHO WAR" />
          </button>
          <div
            className="score score-blue"
            aria-label={`Player 1 score ${score(0)}`}
          >
            <span className="score-label">P1</span>
            <strong key={score(0)}>{score(0)}</strong>
          </div>
          <div
            className={`clock ${snapshot.remaining <= 10 && mode === "playing" ? "urgent" : ""}`}
          >
            <strong
              aria-label={`${mode === "menu" ? MATCH_SECONDS : snapshot.remaining} seconds remaining`}
            >
              {formatTime(mode === "menu" ? MATCH_SECONDS : snapshot.remaining)}
            </strong>
            <span>
              {mode === "menu"
                ? `${WORLD.rounds} ROUNDS. ONE RIVALRY.`
                : `ROUND ${snapshot.round} / ${WORLD.rounds}`}
            </span>
          </div>
          <div
            className="score score-pink"
            aria-label={`Player 2 score ${score(1)}`}
          >
            <span className="score-label">P2</span>
            <strong key={score(1)}>{score(1)}</strong>
          </div>
          <div className="header-actions">
            <button
              className="icon-button sound-button"
              aria-label={muted ? "Turn sound on" : "Mute sound"}
              aria-pressed={!muted}
              onClick={toggleSound}
            >
              {muted ? <SpeakerSlashIcon /> : <SpeakerHighIcon />}
            </button>
            {inMatch ? (
              <button
                className="icon-button pause-button"
                aria-label={mode === "paused" ? "Resume match" : "Pause match"}
                onClick={mode === "paused" ? resume : pause}
              >
                {mode === "paused" ? (
                  <PlayIcon weight="fill" />
                ) : (
                  <PauseIcon weight="bold" />
                )}
              </button>
            ) : (
              <button
                className="icon-button"
                aria-label="How to play"
                onClick={() => setHelp(true)}
              >
                <QuestionIcon />
              </button>
            )}
          </div>
        </header>
        <section
          className={`arena ${mode === "rewind" ? "rewinding" : ""}`}
          ref={arenaRef}
          tabIndex={0}
          aria-label="Echo War arena. Two players share a keyboard. Player one uses W A S D and Shift. Player two uses the arrow keys and Enter."
          data-round={snapshot.round}
          data-echoes={snapshot.echoes}
          data-p1-x={Math.round(snapshot.players[0].x)}
          data-p1-y={Math.round(snapshot.players[0].y)}
          data-p2-x={Math.round(snapshot.players[1].x)}
          data-p2-y={Math.round(snapshot.players[1].y)}
        >
          <canvas
            ref={canvasRef}
            aria-label="Top-down notebook arena with blue and pink players, stars, obstacles and recorded echoes."
          />
          {!ready && (
            <div className="loading-overlay" role="status">
              <img src={`${assets}logo.png`} alt="ECHO WAR" />
              <p>{loadError || "Sharpening the pencils…"}</p>
              {loadError && (
                <button
                  className="text-button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              )}
            </div>
          )}
          {ready && mode === "menu" && (
            <div className="menu-overlay">
              <div className="menu-content">
                <div className="eyebrow">ONE KEYBOARD. TWO RIVALS.</div>
                <h1>
                  Your past
                  <br />
                  is back<span className="pink-period">.</span>
                </h1>
                <p className="menu-description">
                  Steal the stars. Dodge your echoes.
                  <br />
                  Try not to lose to yesterday’s you.
                </p>
                <button className="brush-button" onClick={start}>
                  <PlayIcon weight="fill" size={25} /> Play together{" "}
                  <span className="button-tail">{MATCH_SECONDS}s</span>
                </button>
                <button
                  className="text-button menu-help"
                  onClick={() => setHelp(true)}
                >
                  First time? Here’s the twist <ArrowRightIcon size={18} />
                </button>
                <div className="menu-footnote">
                  Two players · One screen · Endless rematches
                </div>
              </div>
            </div>
          )}
          {mode === "countdown" && (
            <div className="countdown-overlay" aria-live="assertive">
              <span key={count} className="countdown-number">
                {count || "GO!"}
              </span>
              <span className="countdown-caption">
                {count ? "Make some trouble." : "Your first move is history."}
              </span>
            </div>
          )}
          {mode === "rewind" && (
            <div className="rewind-overlay" role="status">
              <ArrowClockwiseIcon size={66} weight="bold" />
              <strong>Your past is back.</strong>
              <span>
                ROUND {rewindRound} — {snapshot.echoes} ECHOES IN PLAY
              </span>
            </div>
          )}
          {mode === "paused" && (
            <Dialog
              label="Match paused"
              close={resume}
              className="pause-dialog"
              container={shellRef.current}
            >
              <div className="eyebrow">PENCILS DOWN</div>
              <h2>Take a breather.</h2>
              <p>The clock can wait. Your echoes can’t.</p>
              <button className="brush-button" onClick={resume}>
                <PlayIcon weight="fill" /> Keep playing
              </button>
              <button className="text-button" onClick={start}>
                <ArrowClockwiseIcon /> Start a new match
              </button>
              <button className="text-button quiet-button" onClick={home}>
                <ArrowLeftIcon /> Back to menu
              </button>
              <label className="motion-toggle">
                <input
                  type="checkbox"
                  checked={motion}
                  onChange={(event) => setMotion(event.target.checked)}
                />{" "}
                Motion effects
              </label>
            </Dialog>
          )}
          {mode === "results" && (
            <Dialog
              label="Match results"
              className="results-dialog"
              container={shellRef.current}
            >
              <div className="eyebrow">THAT’S A WRAP</div>
              <div className="winner-portrait">
                <img
                  src={`${assets}${winner === 1 ? "player-pink" : "player-blue"}.png`}
                  alt=""
                />
              </div>
              <h2>
                {winner === null
                  ? "Call it a draw."
                  : `P${winner + 1} takes the page!`}
              </h2>
              <p>
                {winner === null
                  ? "Same score. Same grudge. One more?"
                  : "The past put up a fight. You won anyway."}
              </p>
              <div className="result-scores">
                <div className="color-0">
                  <span>PLAYER 1</span>
                  <strong>{snapshot.players[0].score}</strong>
                  <small>{snapshot.players[0].collected} stars collected</small>
                </div>
                <span className="versus">vs</span>
                <div className="color-1">
                  <span>PLAYER 2</span>
                  <strong>{snapshot.players[1].score}</strong>
                  <small>{snapshot.players[1].collected} stars collected</small>
                </div>
              </div>
              <button className="brush-button" onClick={start}>
                <ArrowClockwiseIcon weight="bold" /> Settle the score
              </button>
              <button className="text-button" onClick={home}>
                <ArrowLeftIcon /> Back to menu
              </button>
            </Dialog>
          )}
          {help && (
            <Dialog
              label="How to play"
              close={closeHelp}
              className="help-dialog"
              container={shellRef.current}
            >
              <div className="eyebrow">THE SHORT VERSION</div>
              <h2>
                You’re your own
                <br />
                worst obstacle.
              </h2>
              <p>
                Collect more stars than your rival in {MATCH_SECONDS} seconds.
                <br />
                Every {WORLD.roundSeconds} seconds, your old moves come back as
                echoes.
              </p>
              <div className="how-rounds">
                <div>
                  <b>01</b>
                  <span>Make your moves.</span>
                  <small>
                    First {WORLD.roundSeconds}s: just you, your rival, and the
                    stars.
                  </small>
                </div>
                <div>
                  <b>02</b>
                  <span>Meet your past.</span>
                  <small>Two echoes replay your first round.</small>
                </div>
                <div>
                  <b>03</b>
                  <span>Embrace the chaos.</span>
                  <small>
                    Up to {(WORLD.rounds - 1) * 2} echoes. No room for regrets.
                  </small>
                </div>
              </div>
              <div className="rules-note">
                <img src={`${assets}star.png`} alt="" />
                <p>
                  Small star <b>+{STAR_POINTS.normal}</b> · Gold star{" "}
                  <b>+{STAR_POINTS.gold}</b>
                  <br />
                  Hit any echo: <b>−1</b> and a brief stun.
                  <br />
                  <b>P1:</b> tap <b>Shift</b> · <b>P2:</b> tap <b>Enter</b> for
                  a short speed boost.
                  <br />
                  <b>Dash through echoes</b> to stay safe. Recharges in 2.6s.
                </p>
              </div>
              <button
                className="brush-button"
                onClick={mode === "menu" ? start : closeHelp}
              >
                {mode === "menu" ? "Got it. Let’s play." : "Got it."}
                <ArrowRightIcon />
              </button>
            </Dialog>
          )}
        </section>
        <footer className="game-footer">
          <Keyboard player={0} />
          <div className="footer-center">
            <span>Your past is back.</span>
            {inMatch && mode !== "reference" ? (
              <small>{snapshot.echoes} echoes in play · ESC to pause</small>
            ) : (
              <small>AN ORIGINAL TWO-PLAYER RIVALRY</small>
            )}
          </div>
          <Keyboard player={1} />
        </footer>
        <div className="utility-row">
          <span className="device-note">
            Best with two humans and one keyboard.
          </span>
          <span className="version-note">ECHO WAR · VOL. 01</span>
          <button className="fullscreen-button" onClick={fullscreen}>
            <ArrowsOutSimpleIcon size={16} />{" "}
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        <div className="sr-only" role="status" aria-live="polite">
          {mode === "results"
            ? `Match over. Player 1: ${snapshot.players[0].score}. Player 2: ${snapshot.players[1].score}.`
            : mode === "rewind"
              ? `Round ${snapshot.round}. ${snapshot.echoes} echoes in play.`
              : ""}
        </div>
      </div>
    </main>
  );
}
