import { useEffect, useRef, useState } from 'react'
import type { GameSession } from '@/types'

function postToSW(message: Record<string, unknown>) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(message)
  }
}

export function useUnpaidNotification(games: GameSession[], userId: string | undefined) {
  const fired = useRef(false)
  const [permission, setPermission] = useState<NotificationPermission>(
    () => ('Notification' in window ? Notification.permission : 'denied'),
  )

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return
    void Notification.requestPermission().then(setPermission)
  }, [])

  useEffect(() => {
    if (fired.current || !userId || games.length === 0) return
    if (permission !== 'granted') return

    const unpaid = games.filter((g) => {
      const me = g.participants.find((p) => p.userId === userId)
      return me && !me.hasPaid && g.status !== 'settled'
    })

    if (unpaid.length === 0) return
    fired.current = true

    const count = unpaid.length
    const title = `You have ${count} unpaid fee${count > 1 ? 's' : ''} 🏸`
    const body = unpaid
      .slice(0, 3)
      .map((g) => {
        const me = g.participants.find((p) => p.userId === userId)!
        const taxMult = 1 + (g.foodReceipt?.serviceTaxPct ?? 0) / 100
        const foodCost =
          (g.foodReceipt?.items ?? [])
            .filter((i) => i.claimedBy.includes(userId))
            .reduce((s, i) => s + i.price / Math.max(i.claimedBy.length, 1), 0) * taxMult
        const total = me.amountDue + foodCost
        return `${g.title}: RM ${total.toFixed(2)}`
      })
      .join('\n')

    postToSW({ type: 'NOTIFY_UNPAID', title, body, url: '/' })
  }, [games, userId, permission])

  const hasUnpaid =
    !!userId &&
    games.some((g) => {
      const me = g.participants.find((p) => p.userId === userId)
      return me && !me.hasPaid && g.status !== 'settled'
    })

  return { permission, hasUnpaid }
}
