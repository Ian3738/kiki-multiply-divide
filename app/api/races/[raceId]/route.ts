import {
  advanceRound,
  getRace,
  joinRace,
  makeRaceView,
  restartRace,
  slotOf,
  submitRaceAnswer,
} from "@/lib/raceRooms";

type Params = { params: Promise<{ raceId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { raceId } = await params;
  const url = new URL(req.url);
  const playerId = url.searchParams.get("playerId");
  if (!playerId)
    return Response.json({ error: "playerId required" }, { status: 400 });

  let race = await getRace(raceId);
  if (!race) return Response.json({ error: "房間不存在" }, { status: 404 });

  let slot = slotOf(race, playerId);
  if (!slot) {
    race = await joinRace(raceId, playerId);
    if (!race) return Response.json({ error: "房間已滿" }, { status: 409 });
    slot = slotOf(race, playerId);
  }
  if (!slot) return Response.json({ error: "無法加入" }, { status: 500 });
  return Response.json({ view: makeRaceView(race, slot) });
}

export async function POST(req: Request, { params }: Params) {
  const { raceId } = await params;
  const body = await req.json().catch(() => ({}));
  const playerId = typeof body.playerId === "string" ? body.playerId : null;
  const action = typeof body.action === "string" ? body.action : "answer";
  if (!playerId)
    return Response.json({ error: "playerId required" }, { status: 400 });

  if (action === "advance") {
    const r = await advanceRound(raceId);
    if (!r) return Response.json({ error: "房間不存在" }, { status: 404 });
    const slot = slotOf(r, playerId);
    if (!slot) return Response.json({ error: "不在房間裡" }, { status: 403 });
    return Response.json({ view: makeRaceView(r, slot) });
  }

  if (action === "rematch") {
    const r = await restartRace(raceId, playerId);
    if (!r) return Response.json({ error: "重啟失敗" }, { status: 400 });
    const slot = slotOf(r, playerId);
    if (!slot) return Response.json({ error: "不在房間裡" }, { status: 403 });
    return Response.json({ view: makeRaceView(r, slot) });
  }

  const picked = typeof body.picked === "number" ? body.picked : null;
  if (picked === null)
    return Response.json({ error: "picked required" }, { status: 400 });
  const res = await submitRaceAnswer(raceId, playerId, picked);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  const slot = slotOf(res.race, playerId)!;
  return Response.json({
    view: makeRaceView(res.race, slot),
    right: res.right,
    firstCorrect: res.firstCorrect,
  });
}
