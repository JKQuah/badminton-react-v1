export interface User {
  id: string
  phone: string
  name: string
  createdAt: string
}

export interface Participant {
  userId: string
  name: string
  phone: string
  amountDue: number
  hasPaid: boolean
  joinedAt: string
}

export type GameStatus = 'open' | 'closed' | 'settled'

export interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
  claimedBy: string[]  // array of userId
}

export interface FoodReceipt {
  imageDataUrl: string
  items: ReceiptItem[]
  scannedAt: string
}

export interface GameSession {
  id: string
  hostId: string
  hostName: string
  title: string
  venue: string
  date: string
  courtFee: number
  foodFee: number
  participants: Participant[]
  status: GameStatus
  paymentQrImage?: string
  foodReceipt?: FoodReceipt
  createdAt: string
}
