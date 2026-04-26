import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getGame } = useGame()

  const game = getGame(id ?? '')

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent className="space-y-3 pt-4">
            <p className="text-muted-foreground">Game not found</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const myRecord = game.participants.find((p) => p.userId === user?.id)
  const totalFee = game.courtFee + game.foodFee
  const perPerson = game.participants.length > 0
    ? Math.ceil((totalFee / game.participants.length) * 100) / 100
    : 0

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/game/${game.id}`)}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="font-semibold">Payment</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Game Summary */}
        <Card>
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-base">{game.title}</CardTitle>
            <CardDescription>{game.venue}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 text-center gap-2">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">Court</p>
                <p className="font-semibold text-sm">RM {game.courtFee.toFixed(2)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">Shuttlecock</p>
                <p className="font-semibold text-sm">RM {game.foodFee.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <p className="text-[10px] text-green-600">Your Share</p>
                <p className="font-bold text-sm text-green-700">RM {perPerson.toFixed(2)}</p>
              </div>
            </div>

            {myRecord && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-muted-foreground">Your status</span>
                {myRecord.hasPaid ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✓ Paid</Badge>
                ) : (
                  <Badge variant="outline">Awaiting payment</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        {game.paymentQrImage ? (
          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-base">Scan to Pay</CardTitle>
              <CardDescription>
                Pay RM {perPerson.toFixed(2)} to <span className="font-semibold text-foreground">{game.hostName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="border-4 border-green-500 rounded-2xl overflow-hidden p-1 bg-white shadow-lg">
                <img
                  src={game.paymentQrImage}
                  alt="Payment QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Screenshot or scan this QR code to transfer payment to the host
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <CardContent className="space-y-2 pt-4">
              <p className="text-4xl">📷</p>
              <p className="text-sm font-medium">No QR Code Yet</p>
              <p className="text-xs text-muted-foreground">
                The host hasn't uploaded a payment QR code yet. Contact the host directly.
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Participant List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {game.participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-[10px]">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {p.name}
                      {p.userId === user?.id && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">RM {p.amountDue.toFixed(2)}</span>
                    {p.hasPaid ? (
                      <Badge className="text-[10px] h-5 bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5">Unpaid</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Host Contact */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback>{game.hostName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Game hosted by</p>
              <p className="text-sm font-semibold">{game.hostName}</p>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px]">Host</Badge>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
