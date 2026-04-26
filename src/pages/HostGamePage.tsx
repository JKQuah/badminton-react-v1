import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { useGame } from '@/contexts/GameContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(3, 'Session name must be at least 3 characters'),
  venue: z.string().min(2, 'Venue is required'),
  date: z.string().min(1, 'Date is required'),
  courtFee: z.string().regex(/^\d*\.?\d*$/, 'Must be a number'),
  foodFee: z.string().regex(/^\d*\.?\d*$/, 'Must be a number'),
})

type FormValues = z.infer<typeof schema>

export default function HostGamePage() {
  const { user } = useAuth()
  const { createGame } = useGame()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      venue: '',
      date: today,
      courtFee: '0',
      foodFee: '0',
    },
  })

  const courtFeeStr = watch('courtFee') ?? '0'
  const foodFeeStr = watch('foodFee') ?? '0'
  const totalFee = (parseFloat(courtFeeStr) || 0) + (parseFloat(foodFeeStr) || 0)

  const onSubmit = async (values: FormValues) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const game = createGame({
        hostId: user.id,
        hostName: user.name,
        title: values.title,
        venue: values.venue,
        date: values.date,
        courtFee: parseFloat(values.courtFee) || 0,
        foodFee: parseFloat(values.foodFee) || 0,
      })
      toast.success('Game session created!')
      navigate(`/game/${game.id}`)
    } catch {
      toast.error('Failed to create game')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="font-semibold">Host a Game</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session Details</CardTitle>
              <CardDescription>Basic information about the game session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Session Name</Label>
                <Input
                  id="title"
                  placeholder="e.g. Saturday Badminton"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="e.g. Sports Planet Sunway"
                  {...register('venue')}
                />
                {errors.venue && <p className="text-xs text-destructive">{errors.venue.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Breakdown</CardTitle>
              <CardDescription>Enter the total costs to be split equally among all players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="courtFee">Court Fee (RM)</Label>
                <Input
                  id="courtFee"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register('courtFee')}
                />
                {errors.courtFee && <p className="text-xs text-destructive">{errors.courtFee.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="foodFee">Shuttlecock Fee (RM)</Label>
                <Input
                  id="foodFee"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register('foodFee')}
                />
                {errors.foodFee && <p className="text-xs text-destructive">{errors.foodFee.message}</p>}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm font-medium">
                <span>Total Amount</span>
                <span className="text-green-600 font-bold text-base">RM {totalFee.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cost per player will be calculated once participants join.
              </p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Game Session'}
          </Button>
        </form>
      </main>
    </div>
  )
}
