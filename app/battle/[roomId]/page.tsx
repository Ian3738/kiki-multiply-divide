import BattleRoom from "./BattleRoom";

type Params = { params: Promise<{ roomId: string }> };

export default async function BattlePage({ params }: Params) {
  const { roomId } = await params;
  return <BattleRoom roomId={roomId.toUpperCase()} />;
}
