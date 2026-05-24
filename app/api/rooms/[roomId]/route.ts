import {
  getRoom,
  joinRoom,
  makeView,
  restartRoom,
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

// POST /api/rooms/:id
//   body: { playerId, picked }  → 提交答案
//   body: { playerId, action: "rematch" } → 重置房間再戰一場
export async function POST(req: Request, { params }: Params) {
  const { roomId } = await params;
  const body = await req.json().catch(() => ({}));
  const playerId = typeof body.playerId === "string" ? body.playerId : null;
  const action = typeof body.action === "string" ? body.action : null;
  if (!playerId)
    return Response.json({ error: "playerId required" }, { status: 400 });

  if (action === "rematch") {
    const room = await restartRoom(roomId, playerId);
    if (!room) return Response.json({ error: "重啟失敗" }, { status: 400 });
    const slot = slotOf(room, playerId);
    if (!slot) return Response.json({ error: "不在房間裡" }, { status: 403 });
    return Response.json({ view: makeView(room, slot) });
  }

  const picked = typeof body.picked === "number" ? body.picked : null;
  if (picked === null)
    return Response.json({ error: "picked required" }, { status: 400 });
  const res = await submitAnswer(roomId, playerId, picked);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  const slot = slotOf(res.room, playerId)!;
  return Response.json({ view: makeView(res.room, slot), right: res.right });
}
