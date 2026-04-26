import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { GameSession } from "@/types";
import { LogOut, Rocket } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  ongoing: "On-going",
  open: "Open",
  closed: "Closed",
  settled: "Settled",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "success"
> = {
  ongoing: "success",
  open: "secondary",
  closed: "secondary",
  settled: "outline",
};

function GameCard({ game, userId }: { game: GameSession; userId: string }) {
  const navigate = useNavigate();
  const paidCount = game.participants.filter((p) => p.hasPaid).length;
  const total = game.courtFee + game.foodFee;
  const perPerson =
    game.participants.length > 0
      ? Math.ceil((total / game.participants.length) * 100) / 100
      : 0;

  const isHost = game.hostId === userId;
  const isJoined = game.participants.some((p) => p.userId === userId);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/game/${game.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CardTitle className="text-base truncate">{game.title}</CardTitle>
              {isHost && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 h-4 shrink-0 border-green-500 text-green-600"
                >
                  Host
                </Badge>
              )}
              {!isHost && isJoined && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 h-4 shrink-0"
                >
                  Joined
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5 truncate">
              {game.venue}
            </CardDescription>
          </div>
          <Badge variant={STATUS_VARIANT[game.status]} className="font-bold">
            {STATUS_LABEL[game.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {new Date(game.date).toLocaleDateString("en-MY", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {game.startTime &&
              game.endTime &&
              ` · ${game.startTime}–${game.endTime}`}
          </span>
          <span className="font-semibold text-green-600">
            {perPerson > 0
              ? `RM ${perPerson.toFixed(2)}/pax`
              : "No players yet"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {game.participants.length} player
            {game.participants.length !== 1 ? "s" : ""}
          </span>
          <span>
            {paidCount}/{game.participants.length} paid
          </span>
        </div>
        {game.participants.length > 0 && (
          <div className="flex -space-x-2">
            {game.participants.slice(0, 5).map((p) => (
              <Avatar
                key={p.userId}
                className="w-7 h-7 border-2 border-background"
              >
                <AvatarFallback className="text-[10px]">
                  {p.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {game.participants.length > 5 && (
              <Avatar className="w-7 h-7 border-2 border-background">
                <AvatarFallback className="text-[10px] bg-muted">
                  +{game.participants.length - 5}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const { games, gamesLoading } = useGame();
  const navigate = useNavigate();

  const sorted = [...games].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              <Rocket className="text-primary" />
            </span>
            <div>
              <p className="font-semibold leading-tight text-sm">
                Badminton 🏸 Every Friday
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                Hi, {user?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="lg" onClick={() => navigate("/host")}>
              Host Game
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/players")}
            >
              Players
            </Button>
            <Button size="lg" variant="destructive" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {gamesLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : sorted.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent className="space-y-3">
              <div className="text-5xl">🏸</div>
              <CardTitle>No games yet</CardTitle>
              <CardDescription>
                Host the first game to start splitting fees
              </CardDescription>
              <Button onClick={() => navigate("/host")}>Host a Game</Button>
            </CardContent>
          </Card>
        ) : (
          sorted.map((g) => (
            <GameCard key={g.id} game={g} userId={user?.id ?? ""} />
          ))
        )}
      </main>
    </div>
  );
}
