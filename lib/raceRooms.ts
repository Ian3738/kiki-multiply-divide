// KIKI 乘除小達人 — 速度賽房間 store
// 雙方看「同一題」搶答 10 題，先按下且答對的人得 1 分（答錯不扣，但若先按錯讓對方有可能答對的時間）
// 為了簡化：每題雙方都能答，先答對者得 1 分；雙方都錯則無人得分
import { Redis } from "@upstash/redis";
import { QUESTIONS, shuffleInPlace, type Question } from "./questions";

export type Slot = "A" | "B";
export type Phase = "waiting" | "playing" | "done";

export type RacePlayerState = {
  playerId: string;
  score: number;
  // 對「當前題」是否已 lock 自己的答案 + 是否答對
  currentPick: number | null; // 1~4 或 null
  currentRight: boolean | null;
};

export type Race = {
  id: string;
  createdAt: number;
  updatedAt: number;
  phase: Phase;
  // 雙方共用一份題目流
  stream: number[]; // index 進 QUESTIONS
  current: number; // 當前題的 idx（指 stream）
  totalRounds: number;
  A: RacePlayerState | null;
  B: RacePlayerState | null;
  // 當題答案是否已被解開（用「誰先答對」決定）
  roundLocked: boolean;
  winner: Slot | "draw" | null;
};

interface Store {
  get(id: string): Promise<Race | null>;
  save(r: Race): Promise<void>;
  exists(id: string): Promise<boolean>;
}

class MemoryStore implements Store {
  private map: Map<string, Race>;
  constructor() {
    const g = globalThis as unknown as { __memRaces?: Map<string, Race> };
    if (!g.__memRaces) g.__memRaces = new Map();
    this.map = g.__memRaces;
  }
  async get(id: string) {
    return this.map.get(id) ?? null;
  }
  async save(r: Race) {
    this.map.set(r.id, r);
  }
  async exists(id: string) {
    return this.map.has(id);
  }
}

class RedisStore implements Store {
  private redis: Redis;
  private ttl = 60 * 60 * 6;
  constructor(redis: Redis) {
    this.redis = redis;
  }
  private k(id: string) {
    return `kiki:race:${id}`;
  }
  async get(id: string) {
    return (await this.redis.get<Race>(this.k(id))) ?? null;
  }
  async save(r: Race) {
    await this.redis.set(this.k(r.id), r, { ex: this.ttl });
  }
  async exists(id: string) {
    return (await this.redis.exists(this.k(id))) === 1;
  }
}

function buildStore(): Store {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.STORAGE_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.STORAGE_REDIS_TOKEN;
  if (url && token) return new RedisStore(new Redis({ url, token }));
  return new MemoryStore();
}

const g = globalThis as unknown as { __kikiRaceStore?: Store };
const store: Store = g.__kikiRaceStore ?? buildStore();
g.__kikiRaceStore = store;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeRaceId(): string {
  let id = "";
  for (let i = 0; i < 4; i++)
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return id;
}

function newPlayer(playerId: string): RacePlayerState {
  return { playerId, score: 0, currentPick: null, currentRight: null };
}

export function slotOf(r: Race, playerId: string): Slot | null {
  if (r.A?.playerId === playerId) return "A";
  if (r.B?.playerId === playerId) return "B";
  return null;
}

export function currentQuestion(r: Race): Question {
  return QUESTIONS[r.stream[r.current]];
}

export async function createRace(
  playerId: string,
  totalRounds = 10,
): Promise<Race> {
  let id = makeRaceId();
  while (await store.exists(id)) id = makeRaceId();
  const stream = QUESTIONS.map((_, i) => i);
  shuffleInPlace(stream);
  const race: Race = {
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    phase: "waiting",
    stream: stream.slice(0, Math.max(totalRounds, 10)),
    current: 0,
    totalRounds,
    A: newPlayer(playerId),
    B: null,
    roundLocked: false,
    winner: null,
  };
  await store.save(race);
  return race;
}

export async function getRace(id: string): Promise<Race | null> {
  return store.get(id.toUpperCase());
}

export async function joinRace(
  id: string,
  playerId: string,
): Promise<Race | null> {
  const r = await getRace(id);
  if (!r) return null;
  if (slotOf(r, playerId)) return r;
  if (!r.B) {
    r.B = newPlayer(playerId);
    r.phase = "playing";
    r.updatedAt = Date.now();
    await store.save(r);
    return r;
  }
  return null;
}

export type RaceAnswerResult =
  | { ok: true; race: Race; right: boolean; firstCorrect: boolean }
  | { ok: false; error: string };

export async function submitRaceAnswer(
  raceId: string,
  playerId: string,
  pickedIdx: number,
): Promise<RaceAnswerResult> {
  const r = await getRace(raceId);
  if (!r) return { ok: false, error: "房間不存在" };
  if (r.phase !== "playing")
    return { ok: false, error: r.phase === "waiting" ? "等對手加入中" : "比賽已結束" };

  const slot = slotOf(r, playerId);
  if (!slot) return { ok: false, error: "你不在這個房間裡" };
  const me = r[slot]!;
  const other = slot === "A" ? r.B! : r.A!;

  // 該玩家已答過這題 → 拒絕（同一題只能答一次）
  if (me.currentPick !== null)
    return { ok: false, error: "你這題已經答過了" };

  const q = currentQuestion(r);
  const right = pickedIdx === q.answer;
  me.currentPick = pickedIdx;
  me.currentRight = right;

  // 「先答對者得分」邏輯：如果對方還沒答對且這次答對 → 得分 + 鎖題
  let firstCorrect = false;
  if (right && !r.roundLocked) {
    me.score++;
    r.roundLocked = true;
    firstCorrect = true;
  }

  // 進下一題的條件：(1) 已有人答對；或 (2) 雙方都答了
  const bothAnswered = me.currentPick !== null && other.currentPick !== null;
  if (r.roundLocked || bothAnswered) {
    // 進下一題（或結束）
    setTimeout(() => 0, 0);
  }

  r.updatedAt = Date.now();
  await store.save(r);
  return { ok: true, race: r, right, firstCorrect };
}

// 推進到下一題（給前端透過 API 觸發、或定時器觸發）
export async function advanceRound(raceId: string): Promise<Race | null> {
  const r = await getRace(raceId);
  if (!r) return null;
  if (r.phase !== "playing") return r;
  // 還有題 → 推進
  if (r.current + 1 < r.totalRounds) {
    r.current++;
    r.roundLocked = false;
    if (r.A) {
      r.A.currentPick = null;
      r.A.currentRight = null;
    }
    if (r.B) {
      r.B.currentPick = null;
      r.B.currentRight = null;
    }
  } else {
    // 結束 → 判勝負
    r.phase = "done";
    const a = r.A?.score ?? 0;
    const b = r.B?.score ?? 0;
    if (a > b) r.winner = "A";
    else if (b > a) r.winner = "B";
    else r.winner = "draw";
  }
  r.updatedAt = Date.now();
  await store.save(r);
  return r;
}

export type RaceView = {
  id: string;
  phase: Phase;
  you: Slot;
  yourScore: number;
  opponentScore: number;
  opponentJoined: boolean;
  current: number;
  totalRounds: number;
  question: Question;
  yourPick: number | null;
  yourRight: boolean | null;
  opponentPicked: boolean;
  opponentRight: boolean | null;
  roundLocked: boolean;
  winner: Slot | "draw" | null;
};

export function makeRaceView(r: Race, you: Slot): RaceView {
  const me = r[you]!;
  const other = you === "A" ? r.B : r.A;
  return {
    id: r.id,
    phase: r.phase,
    you,
    yourScore: me.score,
    opponentScore: other?.score ?? 0,
    opponentJoined: other !== null,
    current: r.current,
    totalRounds: r.totalRounds,
    question: currentQuestion(r),
    yourPick: me.currentPick,
    yourRight: me.currentRight,
    opponentPicked: other?.currentPick !== null && other?.currentPick !== undefined,
    opponentRight: other?.currentRight ?? null,
    roundLocked: r.roundLocked,
    winner: r.winner,
  };
}
