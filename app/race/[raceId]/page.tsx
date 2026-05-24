import RaceRoom from "./RaceRoom";

type Params = { params: Promise<{ raceId: string }> };

export default async function RacePage({ params }: Params) {
  const { raceId } = await params;
  return <RaceRoom raceId={raceId.toUpperCase()} />;
}
