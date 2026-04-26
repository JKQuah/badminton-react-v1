import { useState, useRef, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { GameStatus } from "@/types";
import { FoodReceiptSection } from "@/components/FoodReceiptSection";
import { ChevronLeft, RefreshCcw, UploadCloud } from "lucide-react";
import { formatTime } from "@/utils/format-date";

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: "ongoing", label: "On-going — Game in progress" },
  { value: "open", label: "Open — Accepting players" },
  { value: "closed", label: "Closed — No more players" },
  { value: "settled", label: "Settled — All paid" },
];

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getGame,
    gamesLoading,
    updateGame,
    addParticipant,
    removeParticipant,
    markPaid,
    setPaymentQr,
  } = useGame();

  const game = getGame(id ?? "");
  const isHost = game?.hostId === user?.id;
  const isParticipant = game?.participants.some((p) => p.userId === user?.id);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editFeesOpen, setEditFeesOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPhone, setNewPlayerPhone] = useState("");
  const [courtFeeEdit, setCourtFeeEdit] = useState("");
  const [foodFeeEdit, setFoodFeeEdit] = useState("");
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [venueEdit, setVenueEdit] = useState("");
  const [dateEdit, setDateEdit] = useState("");
  const [startTimeEdit, setStartTimeEdit] = useState("");
  const [endTimeEdit, setEndTimeEdit] = useState("");
  const [maxPaxEdit, setMaxPaxEdit] = useState("");
  const qrInputRef = useRef<HTMLInputElement>(null);

  if (gamesLoading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent className="space-y-3 pt-4">
            <p className="text-muted-foreground">Game not found</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalFee = game.courtFee + game.foodFee;
  const perPerson =
    game.participants.length > 0
      ? Math.ceil((totalFee / game.participants.length) * 100) / 100
      : 0;
  const paidCount = game.participants.filter((p) => p.hasPaid).length;
  const paidProgress =
    game.participants.length > 0
      ? (paidCount / game.participants.length) * 100
      : 0;

  const handleAddPlayer = () => {
    if (newPlayerName.trim().length < 2) {
      toast.error("Enter player name (min 2 chars)");
      return;
    }
    addParticipant(game.id, {
      userId: crypto.randomUUID(),
      name: newPlayerName.trim(),
      phone: newPlayerPhone.trim(),
      hasPaid: false,
    });
    toast.success(`${newPlayerName.trim()} added`);
    setNewPlayerName("");
    setNewPlayerPhone("");
    setAddDialogOpen(false);
  };

  const handleJoinSelf = () => {
    if (!user) return;
    addParticipant(game.id, {
      userId: user.id,
      name: user.name,
      phone: user.phone,
      hasPaid: false,
    });
    toast.success("You joined the game!");
  };

  const handleQrUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPaymentQr(game.id, dataUrl);
      toast.success("Payment QR uploaded");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDetails = () => {
    if (!venueEdit.trim() || !dateEdit) {
      toast.error("Venue and date are required");
      return;
    }
    updateGame(game.id, {
      venue: venueEdit.trim(),
      date: dateEdit,
      startTime: startTimeEdit,
      endTime: endTimeEdit,
      maxPax: maxPaxEdit ? parseInt(maxPaxEdit, 10) : undefined,
    });
    toast.success("Session details updated");
    setEditDetailsOpen(false);
  };

  const handleSaveFees = () => {
    const court = parseFloat(courtFeeEdit);
    const food = parseFloat(foodFeeEdit);
    if (isNaN(court) || court < 0 || isNaN(food) || food < 0) {
      toast.error("Enter valid fee amounts");
      return;
    }
    updateGame(game.id, { courtFee: court, foodFee: food });
    toast.success("Fees updated");
    setEditFeesOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            className={"rounded-full"}
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{game.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {game.venue}
            </p>
          </div>
          {isHost && (
            <Select
              value={game.status}
              onValueChange={(v) =>
                updateGame(game.id, { status: v as GameStatus })
              }
            >
              <SelectTrigger className="w-auto text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={"w-auto"}>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Session Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Session Info</CardTitle>
              {isHost && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setVenueEdit(game.venue);
                    setDateEdit(game.date);
                    setStartTimeEdit(game.startTime ?? "");
                    setEndTimeEdit(game.endTime ?? "");
                    setMaxPaxEdit(game.maxPax ? String(game.maxPax) : "");
                    setEditDetailsOpen(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-12 shrink-0">Venue</span>
              <span className="font-medium">{game.venue}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-12 shrink-0">Date</span>
              <span className="font-medium">
                {new Date(game.date).toLocaleDateString("en-MY", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {game.startTime && game.endTime && (
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-12 shrink-0">
                  Time
                </span>
                <span className="font-medium">
                  {formatTime(game.startTime)} – {formatTime(game.endTime)}
                </span>
              </div>
            )}
            {game.maxPax && (
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-12 shrink-0">
                  Max
                </span>
                <span className="font-medium">{game.maxPax} players</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Fee Summary</CardTitle>
              {isHost && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setCourtFeeEdit(String(game.courtFee));
                    setFoodFeeEdit(String(game.foodFee));
                    setEditFeesOpen(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Court Fee</p>
                <p className="font-bold text-lg">
                  RM {game.courtFee.toFixed(2)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Shuttlecock</p>
                <p className="font-bold text-lg">
                  RM {game.foodFee.toFixed(2)}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-bold">RM {totalFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Per Player ({game.participants.length} pax)
              </span>
              <span className="font-bold text-green-600 text-lg">
                RM {perPerson.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Progress */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payment Collection</CardTitle>
              <Badge
                variant={
                  paidCount === game.participants.length &&
                  game.participants.length > 0
                    ? "default"
                    : "secondary"
                }
              >
                {paidCount}/{game.participants.length} paid
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={paidProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              RM {(paidCount * perPerson).toFixed(2)} / RM {totalFee.toFixed(2)}{" "}
              collected
            </p>

            {/* QR Code Section */}
            {isHost && (
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs flex flex-row gap-2 items-center justify-center"
                  onClick={() => qrInputRef.current?.click()}
                >
                  {game.paymentQrImage ? (
                    <RefreshCcw size={14} />
                  ) : (
                    <UploadCloud size={14} />
                  )}
                  {game.paymentQrImage
                    ? "Update Payment QR Code"
                    : "Upload Your Payment QR Code"}
                </Button>
                <input
                  ref={qrInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrUpload}
                />
              </div>
            )}

            {game.paymentQrImage && (
              <div className="flex flex-col items-center gap-2 pt-1">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate(`/game/${game.id}/payment`)}
                >
                  View Payment QR →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Players</CardTitle>
                <CardDescription className="text-xs">
                  {game.participants.length}
                  {game.maxPax ? `/${game.maxPax}` : ""} participant
                  {game.participants.length !== 1 ? "s" : ""}
                  {game.maxPax && game.participants.length >= game.maxPax ? " · Full" : ""}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {!isParticipant && game.status === "open" && !(game.maxPax && game.participants.length >= game.maxPax) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={handleJoinSelf}
                  >
                    Join
                  </Button>
                )}
                {isHost && (
                  <Button
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    + Add Player
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {game.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No players yet
              </p>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {game.participants.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="text-xs">
                          {p.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.name}
                          {p.userId === game.hostId && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-[10px] py-0 px-1 h-4"
                            >
                              Host
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          RM {p.amountDue.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.hasPaid ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Unpaid
                          </Badge>
                        )}
                        {isHost && (
                          <Switch
                            checked={p.hasPaid}
                            onCheckedChange={(checked) =>
                              markPaid(game.id, p.userId, checked)
                            }
                            className="scale-75"
                          />
                        )}
                        {isHost && p.userId !== game.hostId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeParticipant(game.id, p.userId)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <FoodReceiptSection
          game={game}
          currentUserId={user?.id ?? ""}
          isHost={isHost}
        />

        {/* Share Game */}
        {/* <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Share Game ID</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{game.id}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(game.id)
                  toast.success('Game ID copied!')
                }}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card> */}
      </main>

      {/* Add Player Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Add a player manually to this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Player Name</Label>
              <Input
                placeholder="e.g. Ahmad Razif"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone (optional)</Label>
              <Input
                placeholder="+60 12-345 6789"
                value={newPlayerPhone}
                onChange={(e) => setNewPlayerPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlayer}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Details Dialog */}
      <Dialog open={editDetailsOpen} onOpenChange={setEditDetailsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Session Details</DialogTitle>
            <DialogDescription>Update venue, date and time</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <Input
                value={venueEdit}
                onChange={(e) => setVenueEdit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={dateEdit}
                onChange={(e) => setDateEdit(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTimeEdit}
                  onChange={(e) => setStartTimeEdit(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTimeEdit}
                  onChange={(e) => setEndTimeEdit(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Max Players (optional)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 12"
                value={maxPaxEdit}
                onChange={(e) => setMaxPaxEdit(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDetails}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fees Dialog */}
      <Dialog open={editFeesOpen} onOpenChange={setEditFeesOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Fees</DialogTitle>
            <DialogDescription>
              Update the court and shuttlecock fees for this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Court Fee (RM)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={courtFeeEdit}
                onChange={(e) => setCourtFeeEdit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Shuttlecock Fee (RM)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={foodFeeEdit}
                onChange={(e) => setFoodFeeEdit(e.target.value)}
              />
            </div>
            {courtFeeEdit && foodFeeEdit && (
              <p className="text-sm text-muted-foreground">
                New total:{" "}
                <span className="font-semibold text-foreground">
                  RM {(Number(courtFeeEdit) + Number(foodFeeEdit)).toFixed(2)}
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFeesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFees}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
