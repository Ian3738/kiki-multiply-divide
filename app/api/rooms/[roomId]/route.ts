import {
  getRoom,
  joinRoom,
  makeView,
  slotOf,
  submitAnswer,
} from "@/lib/rooms";

type Params = { params: Promise<{ roomId: string }> };

// GET /api/rooms/:id?playerId=xxx → 取狀態 view（會嘗試 join）
export async function GET(req: Request, { params }: Params) {
  const { roomId } = await params;
  const url = new URL(req.url);
  const playerId = url.searchParams.get("playerId");
  if (!playerId)
    return Response.json({ error: "playerId required" }, { status: 400 });

  let room = await getRoom(roomId);
  if (!room) return Response.json({ error: "房間不存在" }, { status: 404 });

  // 若還沒在房 → join
  let slot = slotOf(room, playerId);
  if (!slot) {
    room = await joinRoom(roomId, playerId);
    if (!room)
      return Response.json({ error: "房間已滿（2 人對戰）" }, { status: 409 });
    slot = slotOf(room, playerId);
  }
  if (!slot) return Response.json({ error: "無法加入" }, { status: 500 });

  return Response.json({ view: makeView(room, slot) });
}

// POST /api/rooms/:id  body: { playerId, picked }
export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const body = await req.json().catch(() => ({}));
  const playerId = typeof body.playerId === "string" ? body.playerId : null;
  const picked = typeof body.picked === "number" ? body.picked : null;
  if (!playerId || picked === null)
    return Response.json({ error: "playerId & picked required" }, { status: 400 });
  const res = await submitAnswer(roomId, playerId, picked);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  const slot = slotOf(res.room, playerId)!;
  return Response.json({ view: makeView(res.room, slot), right: res.right });
}
