import { createRace } from "@/lib/raceRooms";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const playerId = typeof body.playerId === "string" ? body.playerId : null;
  const rounds = typeof body.rounds === "number" ? body.rounds : 10;
  if (!playerId)
    return Response.json({ error: "playerId required" }, { status: 400 });
  const race = await createRace(playerId, Math.max(5, Math.min(20, rounds)));
  return Response.json({ raceId: race.id });
}
