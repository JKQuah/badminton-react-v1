import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { GameSession, GameStatus, Participant, FoodReceipt, ReceiptItem } from '@/types'
import { supabase } from '@/lib/supabase'

interface GameContextValue {
  games: GameSession[]
  gamesLoading: boolean
  createGame: (game: Omit<GameSession, 'id' | 'createdAt' | 'participants' | 'status'>) => GameSession
  updateGame: (id: string, updates: Partial<GameSession>) => void
  addParticipant: (gameId: string, participant: Omit<Participant, 'amountDue' | 'joinedAt'>) => void
  removeParticipant: (gameId: string, userId: string) => void
  markPaid: (gameId: string, userId: string, paid: boolean) => void
  setPaymentQr: (gameId: string, imageDataUrl: string) => void
  setFoodReceipt: (gameId: string, receipt: FoodReceipt) => void
  updateReceiptItems: (gameId: string, items: ReceiptItem[]) => void
  toggleItemClaim: (gameId: string, itemId: string, userId: string) => void
  removeReceiptItem: (gameId: string, itemId: string) => void
  transferHost: (gameId: string, participant: Participant) => void
  getGame: (id: string) => GameSession | undefined
}

const GameContext = createContext<GameContextValue | null>(null)

type GameRow = {
  id: string
  host_id: string
  host_name: string
  host_phone: string | null
  title: string
  venue: string
  date: string
  start_time: string | null
  end_time: string | null
  max_pax: number | null
  court_fee: number
  food_fee: number
  status: string
  participants: Participant[]
  payment_qr_image: string | null
  food_receipt: FoodReceipt | null
  created_at: string
}

function toDb(game: GameSession): GameRow {
  return {
    id: game.id,
    host_id: game.hostId,
    host_name: game.hostName,
    host_phone: game.hostPhone ?? null,
    title: game.title,
    venue: game.venue,
    date: game.date,
    start_time: game.startTime ?? null,
    end_time: game.endTime ?? null,
    max_pax: game.maxPax ?? null,
    court_fee: game.courtFee,
    food_fee: game.foodFee,
    status: game.status,
    participants: game.participants,
    payment_qr_image: game.paymentQrImage ?? null,
    food_receipt: game.foodReceipt ?? null,
    created_at: game.createdAt,
  }
}

function fromDb(row: GameRow): GameSession {
  return {
    id: row.id,
    hostId: row.host_id,
    hostName: row.host_name,
    hostPhone: row.host_phone ?? undefined,
    title: row.title,
    venue: row.venue,
    date: row.date,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    maxPax: row.max_pax ?? undefined,
    courtFee: Number(row.court_fee),
    foodFee: Number(row.food_fee),
    status: row.status as GameStatus,
    participants: row.participants ?? [],
    paymentQrImage: row.payment_qr_image ?? undefined,
    foodReceipt: row.food_receipt ?? undefined,
    createdAt: row.created_at,
  }
}

function calcAmountDue(game: Pick<GameSession, 'courtFee' | 'foodFee' | 'participants'>): number {
  const count = game.participants.length
  if (count === 0) return 0
  return Math.ceil(((game.courtFee + game.foodFee) / count) * 100) / 100
}

function recalcParticipants(game: GameSession): GameSession {
  const amountDue = calcAmountDue(game)
  return { ...game, participants: game.participants.map((p) => ({ ...p, amountDue })) }
}

async function persist(game: GameSession) {
  const { error } = await supabase.from('games').upsert(toDb(game))
  if (error) console.error('Supabase write error:', error.message)
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<GameSession[]>([])
  const [gamesLoading, setGamesLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load games:', error.message)
        setGames((data ?? []).map(fromDb))
        setGamesLoading(false)
      })
  }, [])

  const mutateGame = (id: string, updater: (g: GameSession) => GameSession) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g
        const next = updater(g)
        void persist(next)
        return next
      }),
    )
  }

  const createGame = (data: Omit<GameSession, 'id' | 'createdAt' | 'participants' | 'status'>): GameSession => {
    const hostParticipant: Participant = {
      userId: data.hostId,
      name: data.hostName,
      phone: data.hostPhone ?? '',
      amountDue: 0,
      hasPaid: false,
      joinedAt: new Date().toISOString(),
    }
    const game: GameSession = {
      ...data,
      id: crypto.randomUUID(),
      participants: [hostParticipant],
      status: 'ongoing',
      createdAt: new Date().toISOString(),
    }
    const recalced = recalcParticipants(game)
    setGames((prev) => [recalced, ...prev])
    void persist(recalced)
    return recalced
  }

  const transferHost = (gameId: string, participant: Participant) =>
    mutateGame(gameId, (g) => ({
      ...g,
      hostId: participant.userId,
      hostName: participant.name,
      hostPhone: participant.phone,
    }))

  const updateGame = (id: string, updates: Partial<GameSession>) =>
    mutateGame(id, (g) => recalcParticipants({ ...g, ...updates }))

  const addParticipant = (gameId: string, participant: Omit<Participant, 'amountDue' | 'joinedAt'>) =>
    mutateGame(gameId, (g) => {
      if (g.participants.some((p) => p.userId === participant.userId)) return g
      const np: Participant = { ...participant, amountDue: 0, joinedAt: new Date().toISOString() }
      return recalcParticipants({ ...g, participants: [...g.participants, np] })
    })

  const removeParticipant = (gameId: string, userId: string) =>
    mutateGame(gameId, (g) =>
      recalcParticipants({ ...g, participants: g.participants.filter((p) => p.userId !== userId) }),
    )

  const markPaid = (gameId: string, userId: string, paid: boolean) =>
    mutateGame(gameId, (g) => ({
      ...g,
      participants: g.participants.map((p) => (p.userId === userId ? { ...p, hasPaid: paid } : p)),
    }))

  const setPaymentQr = (gameId: string, imageDataUrl: string) =>
    mutateGame(gameId, (g) => ({ ...g, paymentQrImage: imageDataUrl }))

  const setFoodReceipt = (gameId: string, receipt: FoodReceipt) =>
    mutateGame(gameId, (g) => ({ ...g, foodReceipt: receipt }))

  const updateReceiptItems = (gameId: string, items: ReceiptItem[]) =>
    mutateGame(gameId, (g) => (g.foodReceipt ? { ...g, foodReceipt: { ...g.foodReceipt, items } } : g))

  const toggleItemClaim = (gameId: string, itemId: string, userId: string) =>
    mutateGame(gameId, (g) => {
      if (!g.foodReceipt) return g
      const items = g.foodReceipt.items.map((item) => {
        if (item.id !== itemId) return item
        const already = item.claimedBy.includes(userId)
        return { ...item, claimedBy: already ? item.claimedBy.filter((id) => id !== userId) : [...item.claimedBy, userId] }
      })
      return { ...g, foodReceipt: { ...g.foodReceipt, items } }
    })

  const removeReceiptItem = (gameId: string, itemId: string) =>
    mutateGame(gameId, (g) =>
      g.foodReceipt
        ? { ...g, foodReceipt: { ...g.foodReceipt, items: g.foodReceipt.items.filter((i) => i.id !== itemId) } }
        : g,
    )

  const getGame = (id: string) => games.find((g) => g.id === id)

  return (
    <GameContext.Provider value={{
      games, gamesLoading, createGame, updateGame, addParticipant, removeParticipant,
      markPaid, setPaymentQr, setFoodReceipt, updateReceiptItems,
      toggleItemClaim, removeReceiptItem, transferHost, getGame,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
