import { useRef, useState, type ChangeEvent } from "react";
import { useGame } from "@/contexts/GameContext";
import { scanReceipt, type ScanProgress } from "@/lib/receiptScanner";
import type { GameSession, ReceiptItem } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CheckCircle,
  Paperclip,
  Plus,
  ScanBarcode,
  UploadCloud,
} from "lucide-react";

interface Props {
  game: GameSession;
  currentUserId: string;
  isHost: boolean;
}

function foodCostForUser(game: GameSession, userId: string): number {
  if (!game.foodReceipt) return 0;
  return game.foodReceipt.items.reduce((sum, item) => {
    if (!item.claimedBy.includes(userId)) return sum;
    return sum + Math.round((item.price / item.claimedBy.length) * 100) / 100;
  }, 0);
}

export function FoodReceiptSection({ game, currentUserId, isHost }: Props) {
  const {
    setFoodReceipt,
    toggleItemClaim,
    removeReceiptItem,
    updateReceiptItems,
  } = useGame();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: "",
    progress: 0,
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  const receipt = game.foodReceipt;
  const participants = game.participants;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (ev) => {
      await runScan(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const runScan = async (dataUrl: string) => {
    setScanning(true);
    setScanProgress({ status: "Starting…", progress: 0 });
    try {
      const items = await scanReceipt(dataUrl, setScanProgress);
      setFoodReceipt(game.id, {
        imageDataUrl: dataUrl,
        items,
        scannedAt: new Date().toISOString(),
      });
      toast.success(
        `Found ${items.length} item${items.length !== 1 ? "s" : ""} on the receipt`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleEditItemName = (itemId: string, name: string) => {
    if (!receipt) return;
    updateReceiptItems(
      game.id,
      receipt.items.map((i) => (i.id === itemId ? { ...i, name } : i)),
    );
  };

  const handleEditItemPrice = (itemId: string, raw: string) => {
    if (!receipt) return;
    const price = parseFloat(raw);
    if (isNaN(price) || price < 0) return;
    updateReceiptItems(
      game.id,
      receipt.items.map((i) => (i.id === itemId ? { ...i, price } : i)),
    );
  };

  const handleAddItem = () => {
    if (!receipt) return;
    const newItem: ReceiptItem = {
      id: crypto.randomUUID(),
      name: "New Item",
      price: 0,
      quantity: 1,
      claimedBy: [],
    };
    updateReceiptItems(game.id, [...receipt.items, newItem]);
  };

  const totalReceiptAmount =
    receipt?.items.reduce((s, i) => s + i.price, 0) ?? 0;
  const claimedTotal =
    receipt?.items.reduce(
      (s, i) => s + (i.claimedBy.length > 0 ? i.price : 0),
      0,
    ) ?? 0;
  const unclaimedTotal = totalReceiptAmount - claimedTotal;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex flex-row items-center gap-2">
                <span className="font-semibold">Food & Drinks</span>
                <Badge className="bg-purple-100 text-purple-800">BETA</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {receipt
                  ? "Tap items to claim what you ordered"
                  : "Upload a receipt to split food costs"}
              </CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              {receipt && isHost && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                >
                  Rescan
                </Button>
              )}
              {!receipt && (
                <Button
                  size="sm"
                  className="text-xs h-7 flex flex-row gap-1 items-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                >
                  {scanning ? (
                    <ScanBarcode size={16} />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  {scanning ? "Scanning…" : "Upload Receipt"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {scanning && (
            <div className="space-y-2 py-2">
              <Progress
                value={Math.round(scanProgress.progress * 100)}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground text-center capitalize">
                {scanProgress.status || "Initialising OCR…"}
              </p>
            </div>
          )}

          {!scanning && receipt && (
            <>
              <Button
                variant="ghost"
                className="w-full h-auto p-0 rounded-lg overflow-hidden border"
                onClick={() => setPreviewOpen(true)}
              >
                <img
                  src={receipt.imageDataUrl}
                  alt="Receipt"
                  className="w-full max-h-28 object-cover object-top"
                />
              </Button>

              <div className="overflow-y-auto max-h-64 space-y-1.5 pr-1">
                {receipt.items.map((item) => {
                  const isClaimed = item.claimedBy.includes(currentUserId);
                  const splitPrice =
                    item.claimedBy.length > 0
                      ? Math.round((item.price / item.claimedBy.length) * 100) /
                        100
                      : item.price;
                  const claimers = item.claimedBy
                    .map((uid) => participants.find((p) => p.userId === uid))
                    .filter(Boolean);

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-row items-center gap-3 p-2.5 rounded-lg border transition-colors ${isClaimed ? "bg-green-50 border-green-200" : "bg-muted/30 border-transparent"}`}
                    >
                      <Button
                        variant={isClaimed ? "default" : "outline"}
                        size="sm"
                        className={`shrink-0 h-7 w-7 p-0 text-xs rounded-full ${isClaimed ? "bg-green-600 hover:bg-green-700" : ""}`}
                        onClick={() =>
                          toggleItemClaim(game.id, item.id, currentUserId)
                        }
                      >
                        {isClaimed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>

                      <div className="flex-1 min-w-0">
                        <input
                          className="bg-transparent text-sm font-medium w-full outline-none focus:underline decoration-dashed"
                          value={item.name}
                          onChange={(e) =>
                            handleEditItemName(item.id, e.target.value)
                          }
                        />
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {item.quantity > 1 && (
                            <span className="text-xs text-muted-foreground">
                              ×{item.quantity}
                            </span>
                          )}
                          {claimers.length > 0 && (
                            <div className="flex -space-x-1">
                              {claimers.map(
                                (p) =>
                                  p && (
                                    <Avatar
                                      key={p.userId}
                                      className="w-4 h-4 border border-background"
                                    >
                                      <AvatarFallback className="text-[8px]">
                                        {p.name.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  ),
                              )}
                            </div>
                          )}
                          {item.claimedBy.length > 1 && (
                            <span className="text-xs text-muted-foreground">
                              ÷{item.claimedBy.length} = RM{" "}
                              {splitPrice.toFixed(2)} each
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right flex flex-row items-start gap-1">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xs text-muted-foreground">
                            RM
                          </span>
                          <input
                            key={item.price}
                            className="bg-transparent text-sm font-semibold w-16 outline-none text-right focus:underline decoration-dashed"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={item.price.toFixed(2)}
                            onBlur={(e) =>
                              handleEditItemPrice(item.id, e.target.value)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive mt-0.5"
                          onClick={() => removeReceiptItem(game.id, item.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs border-dashed"
                onClick={handleAddItem}
              >
                <Plus className="w-3 h-3 mr-1" /> Add item
              </Button>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Receipt total</span>
                  <span>RM {totalReceiptAmount.toFixed(2)}</span>
                </div>
                {unclaimedTotal > 0.005 && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Unclaimed</span>
                    <span>RM {unclaimedTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Settlement Summary
                </p>
                {participants.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No players added yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {participants.map((p) => {
                      const foodCost = foodCostForUser(game, p.userId);
                      const total =
                        Math.round((p.amountDue + foodCost) * 100) / 100;
                      const isCurrentUser = p.userId === currentUserId;

                      return (
                        <div
                          key={p.userId}
                          className={`flex items-center gap-2 p-2 rounded-lg ${isCurrentUser ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}
                        >
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarFallback className="text-[10px]">
                              {p.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {p.name}
                              {isCurrentUser && (
                                <span className="text-muted-foreground ml-1">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Court RM {p.amountDue.toFixed(2)}
                              {foodCost > 0 &&
                                ` + Food RM ${foodCost.toFixed(2)}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-green-600">
                              RM {total.toFixed(2)}
                            </p>
                            {p.hasPaid ? (
                              <Badge className="text-[9px] h-4 bg-green-100 text-green-700 hover:bg-green-100">
                                Paid
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4"
                              >
                                Owes host
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {!scanning && !receipt && (
            <div className="text-center py-4 space-y-3">
              <Paperclip className="mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Take a photo of the food receipt and the app will extract the
                items automatically
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-sm p-2">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle className="text-sm">Receipt</DialogTitle>
          </DialogHeader>
          {receipt && (
            <img
              src={receipt.imageDataUrl}
              alt="Receipt"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
