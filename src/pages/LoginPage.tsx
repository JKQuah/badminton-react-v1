import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "sonner";

export default function LoginPage() {
  const { loginWithPhone } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const loggedIn = await loginWithPhone(cleaned);
      toast.success(`Let's play badminton, ${loggedIn.name}`);
      navigate("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "NOT_REGISTERED") {
        toast.error(
          "Phone number not registered. Ask the group admin to add you.",
        );
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto text-5xl">🏸</div>
          <CardTitle className="text-2xl font-bold">
            Badminton 🏸 Every Friday
          </CardTitle>
          <CardDescription>Enter your phone number to sign in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+60 12-345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Only registered group members can sign in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
