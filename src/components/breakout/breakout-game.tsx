"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  벽돌깨기 (Breakout) — 다양한 아이템이 쏟아지는 캔버스 게임
 * ------------------------------------------------------------------ */

// 모바일 세로 화면 기준 해상도 (9:16에 가까운 비율)
const WIDTH = 450;
const HEIGHT = 800;

const PADDLE_BASE_W = 96;
const PADDLE_H = 16;
const PADDLE_Y = HEIGHT - 70; // 하단에 손가락 공간 확보

const BALL_R = 8;
const BALL_BASE_SPEED = 400; // px/sec (핀볼처럼 빠르게)
const BALL_MIN_VY = 0.34; // 수직 속도 최소 비율 (벽만 타며 멈추는 것 방지)
const PADDLE_MAX_W = 180;

const BRICK_ROWS = 6;
const BRICK_COLS = 7;
const BRICK_GAP = 6;
const BRICK_SIDE = 14;
const BRICK_W = Math.floor(
  (WIDTH - BRICK_SIDE * 2 - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS,
);
const BRICK_H = 22;
const BRICK_TOP = 80;
const BRICK_LEFT =
  (WIDTH - (BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_GAP)) / 2;

type PowerKind =
  | "EXPAND"
  | "SHRINK"
  | "MULTI"
  | "SLOW"
  | "FAST"
  | "LIFE"
  | "LASER"
  | "STICKY"
  | "FIRE"
  | "SHIELD"
  | "SCORE2X"
  | "BIG"
  | "MAGNET"
  | "BOMB"
  | "REVERSE";

type PowerMeta = {
  label: string;
  icon: string;
  color: string;
  good: boolean;
  /** 떨어질 확률 가중치 */
  weight: number;
};

const POWERS: Record<PowerKind, PowerMeta> = {
  EXPAND: { label: "패들 확장", icon: "↔", color: "#22c55e", good: true, weight: 10 },
  MULTI: { label: "멀티볼", icon: "✦", color: "#06b6d4", good: true, weight: 9 },
  SLOW: { label: "슬로우", icon: "🐢", color: "#3b82f6", good: true, weight: 7 },
  LIFE: { label: "추가 생명", icon: "♥", color: "#ec4899", good: true, weight: 4 },
  LASER: { label: "레이저", icon: "⚡", color: "#eab308", good: true, weight: 8 },
  STICKY: { label: "끈끈이", icon: "🩹", color: "#84cc16", good: true, weight: 6 },
  FIRE: { label: "파이어볼", icon: "🔥", color: "#f97316", good: true, weight: 6 },
  SHIELD: { label: "방어막", icon: "🛡", color: "#14b8a6", good: true, weight: 6 },
  SCORE2X: { label: "점수 2배", icon: "✕2", color: "#a855f7", good: true, weight: 7 },
  BIG: { label: "빅볼", icon: "●", color: "#f59e0b", good: true, weight: 6 },
  MAGNET: { label: "자석", icon: "🧲", color: "#0ea5e9", good: true, weight: 5 },
  BOMB: { label: "폭탄", icon: "💣", color: "#ef4444", good: true, weight: 6 },
  SHRINK: { label: "패들 축소", icon: "><", color: "#dc2626", good: false, weight: 6 },
  FAST: { label: "스피드업", icon: "💨", color: "#e11d48", good: false, weight: 6 },
  REVERSE: { label: "조작 반전", icon: "⇄", color: "#9333ea", good: false, weight: 5 },
};

const POWER_KINDS = Object.keys(POWERS) as PowerKind[];

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fire: boolean;
  stuck: boolean; // 끈끈이로 패들에 붙음
  stuckOffset: number;
};

type Brick = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  color: string;
  alive: boolean;
};

type FallingPower = {
  x: number;
  y: number;
  kind: PowerKind;
};

type Laser = { x: number; y: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
};

type Phase = "ready" | "playing" | "paused" | "levelclear" | "gameover";

type ActiveTimers = Partial<Record<PowerKind, number>>;

const BRICK_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#818cf8",
  "#e879f9",
];

function weightedRandomPower(): PowerKind {
  const total = POWER_KINDS.reduce((s, k) => s + POWERS[k].weight, 0);
  let r = Math.random() * total;
  for (const k of POWER_KINDS) {
    r -= POWERS[k].weight;
    if (r <= 0) return k;
  }
  return "EXPAND";
}

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React 상태 = UI 오버레이용
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [activeUi, setActiveUi] = useState<ActiveTimers>({});
  const [toast, setToast] = useState<string | null>(null);

  // 게임 내부 가변 상태 = ref (리렌더 없이 매 프레임 갱신)
  const stateRef = useRef({
    phase: "ready" as Phase,
    score: 0,
    lives: 3,
    level: 1,
    scoreMult: 1,
    paddleX: WIDTH / 2 - PADDLE_BASE_W / 2,
    paddleW: PADDLE_BASE_W,
    targetPaddleX: WIDTH / 2,
    reversed: false,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powers: [] as FallingPower[],
    lasers: [] as Laser[],
    particles: [] as Particle[],
    timers: {} as ActiveTimers, // 남은 시간(초)
    laserCooldown: 0,
    shieldHp: 0,
    shake: 0,
    speedMult: 1, // 슬로우/패스트 아이템용 속도 배수
  });

  const keys = useRef({ left: false, right: false });
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1400);
  }, []);

  /* ----------------------- 레벨 / 공 생성 ----------------------- */

  const buildBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    // 어렵게: 시작부터 행을 꽉 채우고 레벨마다 늘림
    const rows = Math.min(9 + Math.floor((lvl - 1) / 2), 12);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        // 빈칸은 드물게만 (촘촘한 벽 = 더 어려움)
        const gapPattern = (r * 3 + c * 7 + lvl) % 17 === 0;
        if (gapPattern && lvl > 2) continue;
        // 위쪽 행일수록, 레벨이 높을수록 단단함 (최대 6)
        const hp = Math.min(
          1 +
            Math.floor((rows - r) / 2) +
            (lvl > 2 ? 1 : 0) +
            ((r + c) % 4 === 0 ? 1 : 0),
          6,
        );
        bricks.push({
          x: BRICK_LEFT + c * (BRICK_W + BRICK_GAP),
          y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          hp,
          maxHp: hp,
          color: BRICK_COLORS[(r + lvl) % BRICK_COLORS.length],
          alive: true,
        });
      }
    }
    return bricks;
  }, []);

  const spawnBall = useCallback((stuck = true): Ball => {
    const s = stateRef.current;
    const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 0.6;
    return {
      x: s.paddleX + s.paddleW / 2,
      y: PADDLE_Y - BALL_R - 2,
      vx: Math.cos(angle) * BALL_BASE_SPEED,
      vy: Math.sin(angle) * BALL_BASE_SPEED,
      r: BALL_R,
      fire: false,
      stuck,
      stuckOffset: 0,
    };
  }, []);

  const resetForLevel = useCallback(
    (lvl: number) => {
      const s = stateRef.current;
      s.level = lvl;
      s.bricks = buildBricks(lvl);
      s.balls = [spawnBall(true)];
      s.powers = [];
      s.lasers = [];
      s.particles = [];
      s.timers = {};
      s.paddleW = PADDLE_BASE_W;
      s.paddleX = WIDTH / 2 - PADDLE_BASE_W / 2;
      s.targetPaddleX = WIDTH / 2;
      s.reversed = false;
      s.scoreMult = 1;
      s.shieldHp = 0;
      s.laserCooldown = 0;
      setActiveUi({});
    },
    [buildBricks, spawnBall],
  );

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    s.lives = 3;
    setScore(0);
    setLives(3);
    setLevel(1);
    resetForLevel(1);
    s.phase = "playing";
    setPhase("playing");
  }, [resetForLevel]);

  /* ----------------------- 파티클 ----------------------- */

  const burst = useCallback(
    (x: number, y: number, color: string, count = 10, power = 1) => {
      const s = stateRef.current;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (40 + Math.random() * 140) * power;
        s.particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0.5 + Math.random() * 0.4,
          maxLife: 0.9,
          color,
        });
      }
      if (s.particles.length > 400) s.particles.splice(0, s.particles.length - 400);
    },
    [],
  );

  /* ----------------------- 아이템 적용 ----------------------- */

  const applyPower = useCallback(
    (kind: PowerKind) => {
      const s = stateRef.current;
      const meta = POWERS[kind];
      showToast(`${meta.icon} ${meta.label}`);

      const DURATION = 12; // 지속형 아이템 기본 지속시간(초)

      switch (kind) {
        case "EXPAND":
          s.paddleW = Math.min(s.paddleW + 36, PADDLE_MAX_W);
          s.timers.EXPAND = DURATION;
          break;
        case "SHRINK":
          s.paddleW = Math.max(s.paddleW - 35, 50);
          s.timers.SHRINK = DURATION;
          break;
        case "MULTI": {
          const extra: Ball[] = [];
          for (const b of s.balls.slice(0, 6)) {
            for (const da of [-0.5, 0.5]) {
              const speed = Math.hypot(b.vx, b.vy) || BALL_BASE_SPEED;
              const ang = Math.atan2(b.vy, b.vx) + da;
              extra.push({
                ...b,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                stuck: false,
              });
            }
          }
          s.balls.push(...extra);
          break;
        }
        case "SLOW":
          s.speedMult = 0.62;
          delete s.timers.FAST;
          s.timers.SLOW = DURATION;
          break;
        case "FAST":
          s.speedMult = 1.5;
          delete s.timers.SLOW;
          s.timers.FAST = DURATION;
          break;
        case "LIFE":
          s.lives += 1;
          setLives(s.lives);
          break;
        case "LASER":
          s.timers.LASER = DURATION;
          break;
        case "STICKY":
          s.timers.STICKY = DURATION;
          break;
        case "FIRE":
          for (const b of s.balls) b.fire = true;
          s.timers.FIRE = DURATION;
          break;
        case "SHIELD":
          s.shieldHp = 3;
          s.timers.SHIELD = DURATION;
          break;
        case "SCORE2X":
          s.scoreMult = 2;
          s.timers.SCORE2X = DURATION;
          break;
        case "BIG":
          for (const b of s.balls) b.r = BALL_R * 1.8;
          s.timers.BIG = DURATION;
          break;
        case "MAGNET":
          s.timers.MAGNET = DURATION;
          break;
        case "BOMB":
          s.timers.BOMB = DURATION;
          break;
        case "REVERSE":
          s.reversed = true;
          s.timers.REVERSE = 8;
          break;
      }
      setActiveUi({ ...s.timers });
    },
    [showToast],
  );

  const expireTimer = useCallback((kind: PowerKind) => {
    const s = stateRef.current;
    switch (kind) {
      case "FIRE":
        for (const b of s.balls) b.fire = false;
        break;
      case "BIG":
        for (const b of s.balls) b.r = BALL_R;
        break;
      case "SCORE2X":
        s.scoreMult = 1;
        break;
      case "REVERSE":
        s.reversed = false;
        break;
      case "SLOW":
      case "FAST":
        s.speedMult = 1;
        break;
      case "SHIELD":
        s.shieldHp = 0;
        break;
      case "EXPAND":
      case "SHRINK":
        s.paddleW = PADDLE_BASE_W;
        break;
    }
  }, []);

  /* ----------------------- 벽돌 파괴 ----------------------- */

  const hitBrick = useCallback(
    (brick: Brick, ball: Ball | null, damage = 1) => {
      const s = stateRef.current;
      brick.hp -= damage;
      const cx = brick.x + BRICK_W / 2;
      const cy = brick.y + BRICK_H / 2;
      burst(cx, cy, brick.color, 6, 0.8);
      if (brick.hp <= 0) {
        brick.alive = false;
        s.score += 100 * s.scoreMult;
        burst(cx, cy, brick.color, 14, 1.2);
        s.shake = Math.min(s.shake + 3, 12);

        // 폭탄: 주변 벽돌 연쇄 파괴
        if (s.timers.BOMB && Math.random() < 0.5) {
          for (const o of s.bricks) {
            if (!o.alive || o === brick) continue;
            const d = Math.hypot(o.x - brick.x, o.y - brick.y);
            if (d < 110) {
              o.alive = false;
              s.score += 50 * s.scoreMult;
              burst(o.x + BRICK_W / 2, o.y + BRICK_H / 2, o.color, 10, 1);
            }
          }
          s.shake = 14;
        }

        // 아이템 드롭 (확률)
        if (Math.random() < 0.32) {
          s.powers.push({ x: cx, y: cy, kind: weightedRandomPower() });
        }
        setScore(s.score);
      } else {
        s.score += 20 * s.scoreMult;
        setScore(s.score);
      }
      void ball;
    },
    [burst],
  );

  /* ----------------------- 충돌 / 물리 ----------------------- */

  const step = useCallback(
    (dt: number) => {
      const s = stateRef.current;
      if (s.phase !== "playing") return;

      // 타이머 감소
      for (const k of Object.keys(s.timers) as PowerKind[]) {
        const t = s.timers[k];
        if (t === undefined) continue;
        const nt = t - dt;
        if (nt <= 0) {
          delete s.timers[k];
          expireTimer(k);
        } else {
          s.timers[k] = nt;
        }
      }

      // 패들 이동 (키보드)
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      const moveDir = s.reversed ? -dir : dir;
      if (dir !== 0) {
        s.paddleX += moveDir * 520 * dt;
        s.targetPaddleX = s.paddleX + s.paddleW / 2;
      } else {
        // 마우스/터치 목표값으로 부드럽게
        const target = (s.reversed ? WIDTH - s.targetPaddleX : s.targetPaddleX) - s.paddleW / 2;
        s.paddleX += (target - s.paddleX) * Math.min(1, dt * 18);
      }
      s.paddleX = Math.max(0, Math.min(WIDTH - s.paddleW, s.paddleX));
      const paddleCx = s.paddleX + s.paddleW / 2;

      // 레이저 발사
      if (s.timers.LASER) {
        s.laserCooldown -= dt;
        if (s.laserCooldown <= 0) {
          s.laserCooldown = 0.28;
          s.lasers.push({ x: s.paddleX + 12, y: PADDLE_Y });
          s.lasers.push({ x: s.paddleX + s.paddleW - 12, y: PADDLE_Y });
        }
      }
      // 레이저 이동 & 충돌
      for (const l of s.lasers) l.y -= 720 * dt;
      s.lasers = s.lasers.filter((l) => {
        if (l.y < -10) return false;
        for (const b of s.bricks) {
          if (b.alive && l.x >= b.x && l.x <= b.x + BRICK_W && l.y >= b.y && l.y <= b.y + BRICK_H) {
            hitBrick(b, null, 1);
            return false;
          }
        }
        return true;
      });

      // 공 물리 — 핀볼처럼 항상 빠른 일정 속도 (레벨이 오르면 더 빨라짐)
      const targetSpeed =
        BALL_BASE_SPEED * (1 + Math.min(s.level - 1, 8) * 0.06) * s.speedMult;
      for (const ball of s.balls) {
        if (ball.stuck) {
          ball.x = paddleCx + ball.stuckOffset;
          ball.y = PADDLE_Y - ball.r - 2;
          continue;
        }

        // 자석: 패들 쪽으로 약하게 끌림
        if (s.timers.MAGNET && ball.y > HEIGHT / 2) {
          const pull = (paddleCx - ball.x) * 0.6 * dt;
          ball.vx += pull;
        }

        // 속도를 목표값으로 정규화 (절대 느려지지 않음) + 최소 수직 속도 보장
        // → 벽만 타다 멈추지 않고 항상 위로 치고 올라가며 탕탕탕 튕김
        {
          const sp = Math.hypot(ball.vx, ball.vy) || targetSpeed;
          ball.vx = (ball.vx / sp) * targetSpeed;
          ball.vy = (ball.vy / sp) * targetSpeed;
          const minVy = targetSpeed * BALL_MIN_VY;
          if (Math.abs(ball.vy) < minVy) {
            ball.vy = (ball.vy < 0 ? -1 : 1) * minVy;
            const vxMag = Math.sqrt(
              Math.max(0, targetSpeed * targetSpeed - ball.vy * ball.vy),
            );
            ball.vx = (ball.vx < 0 ? -1 : 1) * vxMag;
          }
        }

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // 벽 반사 (탕!)
        if (ball.x - ball.r < 0) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx);
          burst(0, ball.y, "#94a3b8", 3, 0.5);
        } else if (ball.x + ball.r > WIDTH) {
          ball.x = WIDTH - ball.r;
          ball.vx = -Math.abs(ball.vx);
          burst(WIDTH, ball.y, "#94a3b8", 3, 0.5);
        }
        if (ball.y - ball.r < 0) {
          ball.y = ball.r;
          ball.vy = Math.abs(ball.vy);
          burst(ball.x, 0, "#94a3b8", 3, 0.5);
        }

        // 패들 충돌
        if (
          ball.vy > 0 &&
          ball.y + ball.r >= PADDLE_Y &&
          ball.y - ball.r <= PADDLE_Y + PADDLE_H &&
          ball.x >= s.paddleX - ball.r &&
          ball.x <= s.paddleX + s.paddleW + ball.r
        ) {
          const rel = (ball.x - paddleCx) / (s.paddleW / 2); // -1..1
          const angle = rel * (Math.PI / 3); // 최대 60도
          const speed = Math.max(Math.hypot(ball.vx, ball.vy), BALL_BASE_SPEED * 0.8);
          ball.vx = Math.sin(angle) * speed;
          ball.vy = -Math.abs(Math.cos(angle) * speed);
          ball.y = PADDLE_Y - ball.r - 1;
          if (s.timers.STICKY) {
            ball.stuck = true;
            ball.stuckOffset = ball.x - paddleCx;
          }
          burst(ball.x, PADDLE_Y, "#38bdf8", 4, 0.6);
        }

        // 벽돌 충돌 (가장 가까운 한 개 처리)
        for (const b of s.bricks) {
          if (!b.alive) continue;
          if (
            ball.x + ball.r > b.x &&
            ball.x - ball.r < b.x + BRICK_W &&
            ball.y + ball.r > b.y &&
            ball.y - ball.r < b.y + BRICK_H
          ) {
            if (!ball.fire) {
              // 반사 방향 결정 (침투 깊이 비교)
              const overlapL = ball.x + ball.r - b.x;
              const overlapR = b.x + BRICK_W - (ball.x - ball.r);
              const overlapT = ball.y + ball.r - b.y;
              const overlapB = b.y + BRICK_H - (ball.y - ball.r);
              const minX = Math.min(overlapL, overlapR);
              const minY = Math.min(overlapT, overlapB);
              if (minX < minY) {
                ball.vx = overlapL < overlapR ? -Math.abs(ball.vx) : Math.abs(ball.vx);
              } else {
                ball.vy = overlapT < overlapB ? -Math.abs(ball.vy) : Math.abs(ball.vy);
              }
            }
            hitBrick(b, ball, ball.fire ? 2 : 1);
            if (!ball.fire) break;
          }
        }
      }

      // 바닥으로 떨어진 공 제거 / 방어막
      s.balls = s.balls.filter((ball) => {
        if (ball.y - ball.r > HEIGHT) {
          if (s.shieldHp > 0) {
            // 방어막이 튕겨냄
            return false; // 그래도 그 공은 사라지지만 아래서 보충 체크
          }
          return false;
        }
        return true;
      });

      // 방어막으로 공 튕기기: 바닥 근처에서 처리
      if (s.shieldHp > 0) {
        for (const ball of s.balls) {
          if (ball.vy > 0 && ball.y + ball.r >= HEIGHT - 6 && ball.y < HEIGHT) {
            ball.vy = -Math.abs(ball.vy);
            ball.y = HEIGHT - 6 - ball.r;
            s.shieldHp -= 1;
            burst(ball.x, HEIGHT - 6, "#2dd4bf", 8, 1);
            if (s.shieldHp <= 0) {
              delete s.timers.SHIELD;
              expireTimer("SHIELD");
            }
          }
        }
      }

      // 모든 공 소실 -> 생명 감소
      if (s.balls.length === 0) {
        s.lives -= 1;
        setLives(s.lives);
        s.shake = 16;
        if (s.lives <= 0) {
          s.phase = "gameover";
          setPhase("gameover");
          setHighScore((h) => {
            const nh = Math.max(h, s.score);
            try {
              window.localStorage.setItem("breakout_high", String(nh));
            } catch {}
            return nh;
          });
        } else {
          // 새 공 (붙은 상태), 일부 효과 초기화
          s.balls = [spawnBall(true)];
          s.reversed = false;
          delete s.timers.REVERSE;
        }
      }

      // 떨어지는 아이템
      for (const p of s.powers) p.y += 150 * dt;
      s.powers = s.powers.filter((p) => {
        if (p.y > HEIGHT + 20) return false;
        // 패들과 충돌?
        if (
          p.y + 12 >= PADDLE_Y &&
          p.y - 12 <= PADDLE_Y + PADDLE_H &&
          p.x >= s.paddleX - 12 &&
          p.x <= s.paddleX + s.paddleW + 12
        ) {
          applyPower(p.kind);
          burst(p.x, p.y, POWERS[p.kind].color, 12, 1);
          return false;
        }
        return true;
      });

      // 파티클
      for (const pt of s.particles) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 240 * dt;
        pt.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // 화면 흔들림 감쇠
      s.shake = Math.max(0, s.shake - dt * 30);

      // 레벨 클리어
      if (s.bricks.every((b) => !b.alive)) {
        s.phase = "levelclear";
        setPhase("levelclear");
      }

      setActiveUi({ ...s.timers });
    },
    [applyPower, burst, expireTimer, hitBrick, spawnBall],
  );

  /* ----------------------- 렌더 ----------------------- */

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;
    ctx.save();

    // 흔들림
    if (s.shake > 0.2) {
      ctx.translate(
        (Math.random() - 0.5) * s.shake,
        (Math.random() - 0.5) * s.shake,
      );
    }

    // 배경
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, "#0b1220");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);

    // 벽돌
    for (const b of s.bricks) {
      if (!b.alive) continue;
      const dmg = 1 - b.hp / b.maxHp;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 1;
      roundRect(ctx, b.x, b.y, BRICK_W, BRICK_H, 5);
      ctx.fill();
      // 내구도 표시 (어둡게)
      if (dmg > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        roundRect(ctx, b.x, b.y, BRICK_W, BRICK_H, 5);
        ctx.fill();
      }
      // 하이라이트
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      roundRect(ctx, b.x + 2, b.y + 2, BRICK_W - 4, 6, 3);
      ctx.fill();
      if (b.maxHp > 1) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(b.hp), b.x + BRICK_W / 2, b.y + BRICK_H / 2 + 4);
      }
    }

    // 떨어지는 아이템
    for (const p of s.powers) {
      const meta = POWERS[p.kind];
      ctx.beginPath();
      ctx.fillStyle = meta.color;
      ctx.globalAlpha = 0.95;
      roundRect(ctx, p.x - 16, p.y - 12, 32, 24, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = meta.good ? "#06281a" : "#2a0710";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.icon, p.x, p.y + 1);
      ctx.textBaseline = "alphabetic";
    }

    // 레이저
    ctx.fillStyle = "#fde047";
    for (const l of s.lasers) {
      ctx.fillRect(l.x - 2, l.y - 14, 4, 14);
    }

    // 방어막
    if (s.shieldHp > 0) {
      ctx.fillStyle = `rgba(45,212,191,${0.25 + 0.15 * s.shieldHp})`;
      ctx.fillRect(0, HEIGHT - 6, WIDTH, 6);
    }

    // 패들
    const pgrad = ctx.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + PADDLE_H);
    pgrad.addColorStop(0, s.reversed ? "#c084fc" : "#60a5fa");
    pgrad.addColorStop(1, s.reversed ? "#7c3aed" : "#2563eb");
    ctx.fillStyle = pgrad;
    roundRect(ctx, s.paddleX, PADDLE_Y, s.paddleW, PADDLE_H, 8);
    ctx.fill();
    if (s.timers.LASER) {
      ctx.fillStyle = "#fde047";
      ctx.fillRect(s.paddleX + 8, PADDLE_Y - 6, 6, 6);
      ctx.fillRect(s.paddleX + s.paddleW - 14, PADDLE_Y - 6, 6, 6);
    }

    // 공
    for (const ball of s.balls) {
      ctx.beginPath();
      if (ball.fire) {
        const fg = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, ball.r * 1.6);
        fg.addColorStop(0, "#fff7ed");
        fg.addColorStop(0.5, "#fb923c");
        fg.addColorStop(1, "rgba(249,115,22,0)");
        ctx.fillStyle = fg;
        ctx.arc(ball.x, ball.y, ball.r * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#fdba74";
      } else {
        ctx.fillStyle = "#f8fafc";
      }
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 파티클
    for (const pt of s.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }, []);

  /* ----------------------- 메인 루프 ----------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const h = window.localStorage.getItem("breakout_high");
      if (h) setHighScore(Number(h) || 0);
    } catch {}

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.033) dt = 0.033; // 프레임 드랍 보호 (빠른 공 관통 방지)
      step(dt);
      draw(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [step, draw]);

  /* ----------------------- 입력 처리 ----------------------- */

  const releaseStuckBalls = useCallback(() => {
    const s = stateRef.current;
    for (const b of s.balls) {
      if (b.stuck) {
        b.stuck = false;
        const speed = BALL_BASE_SPEED;
        // ang=0 이면 똑바로 위로. 붙은 위치에 따라 좌우로 기울여 발사 (최대 ±51도)
        const ang = (b.stuckOffset / (s.paddleW / 2)) * (Math.PI / 3.5);
        b.vx = Math.sin(ang) * speed;
        b.vy = -Math.abs(Math.cos(ang) * speed);
      }
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        const s = stateRef.current;
        if (s.phase === "playing") releaseStuckBalls();
        else if (s.phase === "ready" || s.phase === "gameover") startGame();
        else if (s.phase === "levelclear") {
          resetForLevel(s.level + 1);
          setLevel(s.level);
          s.phase = "playing";
          setPhase("playing");
        }
      }
      if (e.key === "p" || e.key === "P") {
        const s = stateRef.current;
        if (s.phase === "playing") {
          s.phase = "paused";
          setPhase("paused");
        } else if (s.phase === "paused") {
          s.phase = "playing";
          setPhase("playing");
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [releaseStuckBalls, resetForLevel, startGame]);

  const pointerToGameX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return WIDTH / 2;
    const rect = canvas.getBoundingClientRect();
    const ratio = WIDTH / rect.width;
    return (clientX - rect.left) * ratio;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const s = stateRef.current;
      s.targetPaddleX = Math.max(0, Math.min(WIDTH, pointerToGameX(e.clientX)));
    },
    [pointerToGameX],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const s = stateRef.current;
      s.targetPaddleX = Math.max(0, Math.min(WIDTH, pointerToGameX(e.clientX)));
      if (s.phase === "playing") releaseStuckBalls();
      else if (s.phase === "ready" || s.phase === "gameover") startGame();
      else if (s.phase === "levelclear") {
        resetForLevel(s.level + 1);
        setLevel(s.level);
        s.phase = "playing";
        setPhase("playing");
      }
    },
    [pointerToGameX, releaseStuckBalls, resetForLevel, startGame],
  );

  /* ----------------------- UI ----------------------- */

  const activeList = (Object.keys(activeUi) as PowerKind[]).filter(
    (k) => (activeUi[k] ?? 0) > 0,
  );

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col gap-2 px-2 py-2">
      {/* 스코어 바 */}
      <div className="flex shrink-0 items-center justify-between rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-mono text-slate-100 ring-1 ring-white/10">
        <span className="flex items-center gap-1">
          <span className="text-amber-400">★</span> 점수{" "}
          <b className="text-amber-300">{score.toLocaleString()}</b>
        </span>
        <span>
          레벨 <b className="text-cyan-300">{level}</b>
        </span>
        <span className="flex items-center gap-1 text-pink-400">
          {"♥".repeat(Math.max(0, lives))}
          <span className="text-slate-500">{lives <= 0 ? "—" : ""}</span>
        </span>
        <span className="text-slate-400">
          최고 <b className="text-slate-200">{highScore.toLocaleString()}</b>
        </span>
      </div>

      {/* 캔버스 */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-950 ring-1 ring-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          className="block h-full max-h-full w-auto max-w-full touch-none select-none"
          style={{ aspectRatio: `${WIDTH}/${HEIGHT}` }}
        />

        {/* 활성 아이템 표시 */}
        {activeList.length > 0 && (
          <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
            {activeList.map((k) => (
              <span
                key={k}
                className="rounded-md px-2 py-0.5 text-xs font-bold text-white shadow"
                style={{ background: POWERS[k].color }}
                title={POWERS[k].label}
              >
                {POWERS[k].icon} {Math.ceil(activeUi[k] ?? 0)}s
              </span>
            ))}
          </div>
        )}

        {/* 토스트 */}
        {toast && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1 text-sm font-bold text-white">
            {toast}
          </div>
        )}

        {/* 오버레이 */}
        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 text-center text-slate-100 backdrop-blur-sm">
            {phase === "ready" && (
              <>
                <h1 className="text-4xl font-extrabold tracking-tight">
                  🧱 벽돌깨기
                </h1>
                <p className="max-w-md text-sm text-slate-300">
                  15종의 아이템이 쏟아집니다. 패들로 공을 튕겨 벽돌을 모두
                  부수세요!
                </p>
                <button
                  onClick={startGame}
                  className="rounded-lg bg-cyan-500 px-6 py-2.5 text-lg font-bold text-slate-950 shadow-lg transition hover:bg-cyan-400"
                >
                  게임 시작 ▶
                </button>
              </>
            )}
            {phase === "paused" && (
              <>
                <h2 className="text-3xl font-bold">일시정지</h2>
                <p className="text-sm text-slate-300">P 키로 계속</p>
              </>
            )}
            {phase === "levelclear" && (
              <>
                <h2 className="text-3xl font-bold text-emerald-300">
                  레벨 {level} 클리어! 🎉
                </h2>
                <p className="text-sm text-slate-300">
                  현재 점수 {score.toLocaleString()}
                </p>
                <button
                  onClick={() => {
                    const s = stateRef.current;
                    resetForLevel(s.level + 1);
                    setLevel(s.level);
                    s.phase = "playing";
                    setPhase("playing");
                  }}
                  className="rounded-lg bg-emerald-500 px-6 py-2.5 text-lg font-bold text-slate-950 shadow-lg transition hover:bg-emerald-400"
                >
                  다음 레벨 ▶
                </button>
              </>
            )}
            {phase === "gameover" && (
              <>
                <h2 className="text-4xl font-extrabold text-rose-400">
                  게임 오버
                </h2>
                <p className="text-slate-200">
                  최종 점수{" "}
                  <b className="text-amber-300">{score.toLocaleString()}</b>
                  {score >= highScore && score > 0 && (
                    <span className="ml-2 text-cyan-300">신기록! 🏆</span>
                  )}
                </p>
                <button
                  onClick={startGame}
                  className="rounded-lg bg-rose-500 px-6 py-2.5 text-lg font-bold text-white shadow-lg transition hover:bg-rose-400"
                >
                  다시 시작 ↻
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 조작법 + 아이템 범례 (모바일: 접이식) */}
      <div className="shrink-0 rounded-xl bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300 ring-1 ring-white/10">
        <p className="mb-1 leading-snug">
          <b className="text-slate-100">조작</b> — 화면을 좌우로 드래그해 패들 이동,
          탭하면 발사·시작
        </p>
        <details>
          <summary className="cursor-pointer list-none text-slate-400 [&::-webkit-details-marker]:hidden">
            ▸ 아이템 15종 보기
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {POWER_KINDS.map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px]"
                  style={{ background: POWERS[k].color }}
                >
                  {POWERS[k].icon}
                </span>
                <span
                  className={POWERS[k].good ? "text-slate-300" : "text-rose-300"}
                >
                  {POWERS[k].label}
                </span>
              </span>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

/* 라운드 사각형 헬퍼 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
