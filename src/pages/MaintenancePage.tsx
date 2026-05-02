import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-5 max-w-sm">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-5">
            <WifiOff className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Service Unavailable</h1>
          <p className="text-sm text-muted-foreground">
            Unable to connect to the server. This may be a temporary outage —
            please try again in a moment.
          </p>
        </div>
        <Button className="w-full" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </div>
  );
}
