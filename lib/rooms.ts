// KIKI 乘除小達人 — 雙人對戰房間 store
// 兩位玩家各自獨立題目流（從康軒 155 題隨機取 N 題），互相比速度
// 答對 → 對方 -15 HP；答錯 → 自己 -8 HP；任一方 HP=0 即 KO
import { Redis } from "@upstash/redis";
import { QUESTIONS, shuffleInPlace, type Question } from "./questions";

export type Slot = "A" | "B";
export type Phase = "waiting" | "playing" | "done";

export type PlayerState = {
  playerId: string;
  hp: number;
  correct: number;
  wrong: number;
  idx: number;
  // 自己的題目流 — 雙方獨立洗牌
  stream: number[]; // 指向 QUESTIONS 的 index
};

export type Room = {
  id: string;
  createdAt: number;
  updatedAt: number;
  phase: Phase;
  A: PlayerState | null;
  B: PlayerState | null;
  // KO 結果（done 時）
  winner: Slot | "draw" | null;
};

// ───── HP 規則 ─────
export const MAX_HP = 100;
export const HIT_DAMAGE = 15; // 答對 → 對方 -15
export const SELF_DAMAGE = 8; // 答錯 → 自己 -8

// ───── Store ─────
interface Store {
  get(id: string): Promise<Room | null>;
  save(room: Room): Promise<void>;
  exists(id: string): Promise<boolean>;
}

class MemoryStore implements Store {
  private map: Map<string, Room>;
  constructor() {
    const g = globalThis as unknown as { __memRooms?: Map<string, Room> };
    if (!g.__memRooms) g.__memRooms = new Map();
    this.map = g.__memRooms;
  }
  async get(id: string) {
    return this.map.get(id) ?? null;
  }
  async save(r: Room) {
    this.map.set(r.id, r);
  }
  async exists(id: string) {
    return this.map.has(id);
  }
}

class RedisStore implements Store {
  private redis: Redis;
  private ttl = 60 * 60 * 6; // 6 小時自動過期
  constructor(redis: Redis) {
    this.redis = redis;
  }
  private k(id: string) {
    return `kiki:room:${id}`;
  }
  async get(id: string) {
    return (await this.redis.get<Room>(this.k(id))) ?? null;
  }
  async save(r: Room) {
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

const g = globalThis as unknown as { __kikiRoomStore?: Store };
const store: Store = g.__kikiRoomStore ?? buildStore();
g.__kikiRoomStore = store;

// ───── Helpers ─────
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeRoomId(): string {
  let id = "";
  for (let i = 0; i < 4; i++)
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return id;
}

function makeStream(): number[] {
  const arr = QUESTIONS.map((_, i) => i);
  shuffleInPlace(arr);
  // 複製兩輪確保不會用完
  return arr.concat(shuffleInPlace(arr.slice()));
}

function makePlayer(playerId: string): PlayerState {
  return {
    playerId,
    hp: MAX_HP,
    correct: 0,
    wrong: 0,
    idx: 0,
    stream: makeStream(),
  };
}

export function slotOf(room: Room, playerId: string): Slot | null {
  if (room.A?.playerId === playerId) return "A";
  if (room.B?.playerId === playerId) return "B";
  return null;
}

export function currentQuestion(p: PlayerState): Question {
  return QUESTIONS[p.stream[p.idx % p.stream.length]];
}

// ───── Public API ─────
export async function createRoom(playerId: string): Promise<Room> {
  let id = makeRoomId();
  while (await store.exists(id)) id = makeRoomId();
  const room: Room = {
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    phase: "waiting",
    A: makePlayer(playerId),
    B: null,
    winner: null,
  };
  await store.save(room);
  return room;
}

export async function getRoom(id: string): Promise<Room | null> {
  return store.get(id.toUpperCase());
}

export async function joinRoom(
  id: string,
  playerId: string,
): Promise<Room | null> {
  const room = await getRoom(id);
  if (!room) return null;
  // 已在房間（重新整理／回頭）→ 直接回
  if (slotOf(room, playerId)) return room;
  // 加入 B 位
  if (!room.B) {
    room.B = makePlayer(playerId);
    room.phase = "playing";
    room.updatedAt = Date.now();
    await store.save(room);
    return room;
  }
  return null;
}

// 重置房間 — 雙方 HP/correct/wrong/idx 全部歸零、重新洗題目流、phase 回到 playing
export async function restartRoom(
  roomId: string,
  playerId: string,
): Promise<Room | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  if (!slotOf(room, playerId)) return null;
  if (room.A) {
    room.A.hp = MAX_HP;
    room.A.correct = 0;
    room.A.wrong = 0;
    room.A.idx = 0;
    room.A.stream = makeStream();
  }
  if (room.B) {
    room.B.hp = MAX_HP;
    room.B.correct = 0;
    room.B.wrong = 0;
    room.B.idx = 0;
    room.B.stream = makeStream();
  }
  room.phase = room.A && room.B ? "playing" : "waiting";
  room.winner = null;
  room.updatedAt = Date.now();
  await store.save(room);
  return room;
}

export type AnswerResult =
  | { ok: true; room: Room; right: boolean }
  | { ok: false; error: string };

export async function submitAnswer(
  roomId: string,
  playerId: string,
  pickedIdx: number,
): Promise<AnswerResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "房間不存在" };
  if (room.phase !== "playing")
    return { ok: false, error: room.phase === "waiting" ? "等對手加入中" : "對戰已結束" };
  const slot = slotOf(room, playerId);
  if (!slot) return { ok: false, error: "你不在這個房間裡" };

  const me = room[slot]!;
  const other = slot === "A" ? room.B! : room.A!;
  const q = currentQuestion(me);
  const right = pickedIdx === q.answer;

  if (right) {
    me.correct++;
    other.hp = Math.max(0, other.hp - HIT_DAMAGE);
  } else {
    me.wrong++;
    me.hp = Math.max(0, me.hp - SELF_DAMAGE);
  }
  me.idx++;

  // 檢查 KO
  if (room.A!.hp <= 0 || room.B!.hp <= 0) {
    room.phase = "done";
    if (room.A!.hp <= 0 && room.B!.hp <= 0) room.winner = "draw";
    else if (room.A!.hp <= 0) room.winner = "B";
    else room.winner = "A";
  }

  room.updatedAt = Date.now();
  await store.save(room);
  return { ok: true, room, right };
}

// 給前端用的「精簡 view」：對手只看到 HP/score，不洩漏對手題目
export type RoomView = {
  id: string;
  phase: Phase;
  you: Slot;
  yourState: {
    hp: number;
    correct: number;
    wrong: number;
    currentQ: Question;
    idx: number;
  };
  opponentState: {
    hp: number;
    correct: number;
    wrong: number;
    joined: boolean;
  };
  winner: Slot | "draw" | null;
};

export function makeView(room: Room, you: Slot): RoomView {
  const me = room[you]!;
  const other = you === "A" ? room.B : room.A;
  return {
    id: room.id,
    phase: room.phase,
    you,
    yourState: {
      hp: me.hp,
      correct: me.correct,
      wrong: me.wrong,
      currentQ: currentQuestion(me),
      idx: me.idx,
    },
    opponentState: {
      hp: other?.hp ?? MAX_HP,
      correct: other?.correct ?? 0,
      wrong: other?.wrong ?? 0,
      joined: other !== null,
    },
    winner: room.winner,
  };
}
