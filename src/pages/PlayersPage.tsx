import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getRegistry,
  addPlayer,
  removePlayer,
  type RegisteredPlayer,
} from "@/lib/playerRegistry";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PlayersPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [removeTarget, setRemoveTarget] = useState<RegisteredPlayer | null>(
    null,
  );

  useEffect(() => {
    getRegistry().then(setPlayers);
  }, []);

  const refresh = () => getRegistry().then(setPlayers);

  const handleAdd = async () => {
    const name = nameInput.trim();
    const phone = phoneInput.replace(/\D/g, "");
    if (name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (phone.length < 7) {
      toast.error("Enter a valid phone number");
      return;
    }
    await addPlayer(phone, name);
    await refresh();
    toast.success(`${name} added`);
    setNameInput("");
    setPhoneInput("");
    setAddOpen(false);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    await removePlayer(removeTarget.phone);
    await refresh();
    toast.success(`${removeTarget.name} removed`);
    setRemoveTarget(null);
  };

  const formatPhone = (raw: string) => {
    if (raw.length <= 2) return raw;
    if (raw.startsWith("60"))
      return `+${raw.slice(0, 2)} ${raw.slice(2, 4)}-${raw.slice(4, 8)} ${raw.slice(8)}`;
    return raw;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={"rounded-full"}
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <p className="font-semibold text-sm">Registered Players</p>
            <p className="text-xs text-muted-foreground">
              {players.length} member{players.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add Player
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-amber-800">
              Players registered here can sign in using their phone number only
              — no passcode needed. Anyone not on this list will be blocked from
              signing in.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Members</CardTitle>
            <CardDescription className="text-xs">
              Tap the × to remove a player
            </CardDescription>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-3xl">👥</p>
                <p className="text-sm text-muted-foreground">No players yet</p>
                <p className="text-xs text-muted-foreground">
                  Add your group members so they can sign in
                </p>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  Add First Player
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {players.map((p, i) => (
                  <div key={p.phone}>
                    {i > 0 && <Separator className="my-1" />}
                    <div className="flex items-center gap-3 py-1.5">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="text-xs">
                          {p.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatPhone(p.phone)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setRemoveTarget(p)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add player dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Register a group member so they can sign in with their phone
              number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Ahmad Razif"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="0123456789"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <p className="text-xs text-muted-foreground">
                Digits only are stored — dashes and spaces are ignored.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Player</DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold">{removeTarget?.name}</span>{" "}
              from the group? They won't be able to sign in until re-added.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
