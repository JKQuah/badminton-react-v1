import { createWorker } from 'tesseract.js'
import type { ReceiptItem } from '@/types'

// Lines that are definitely not food items
const SKIP_RE =
  /total|subtotal|sub.total|tax|gst|sst|vat|service charge|service tax|rounding|adjustment|change|cash|balance|payment|receipt|invoice|bill|thank|welcome|date|time|table|order|staff|waiter|cashier|tel|fax|phone|reg\.?\s*no|address|www\.|http|member|loyalty|point|voucher|\bno\b\.?\s*\d|\d{6,}|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|%/i

// A price at the end of a line — must have exactly 2 decimal places, max 4 digits before dot
// e.g. "12.50", "RM 12.50", "1,234.50"
const PRICE_RE = /(?:RM\s*)?(\d{1,4}[.,]\d{2})\s*(?:RM)?\s*$/i

const QTY_PREFIX_RE = /^(\d{1,2})\s*[xX×@]\s*/
const QTY_SUFFIX_RE = /\s*[xX×@]\s*(\d{1,2})\s*$/

// Name must contain at least one real letter (not just symbols/numbers)
const HAS_LETTER_RE = /[a-zA-Z]/

function parseReceiptText(raw: string): ReceiptItem[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3)

  const items: ReceiptItem[] = []

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue

    const priceMatch = line.match(PRICE_RE)
    if (!priceMatch) continue

    const price = parseFloat(priceMatch[1].replace(',', '.'))
    // Sanity check: food items on a receipt are typically RM 0.20 – RM 500
    if (!price || price < 0.2 || price > 500) continue

    // Everything left of the price = name candidate
    let namePart = line.slice(0, line.lastIndexOf(priceMatch[0])).trim()
    namePart = namePart.replace(/^RM\s*/i, '').replace(/\s*RM\s*$/i, '').trim()

    // Extract quantity prefix/suffix
    let quantity = 1
    const prefixQ = namePart.match(QTY_PREFIX_RE)
    const suffixQ = namePart.match(QTY_SUFFIX_RE)
    if (prefixQ) {
      quantity = parseInt(prefixQ[1])
      namePart = namePart.replace(QTY_PREFIX_RE, '').trim()
    } else if (suffixQ) {
      quantity = parseInt(suffixQ[1])
      namePart = namePart.replace(QTY_SUFFIX_RE, '').trim()
    }

    // Clean OCR artefacts
    const name = namePart
      .replace(/[|_]{2,}/g, '')   // long pipes/underscores are column separators
      .replace(/\s{2,}/g, ' ')
      .trim()

    // Must have real letters and be reasonably long
    if (!HAS_LETTER_RE.test(name) || name.length < 3) continue

    // Skip if the "name" is just a number (e.g. barcode leftovers)
    if (/^\d[\d\s]*$/.test(name)) continue

    items.push({
      id: crypto.randomUUID(),
      name,
      price: Math.round(price * 100) / 100,
      quantity: Math.max(1, Math.min(99, quantity)),
      claimedBy: [],
    })
  }

  return items
}

export type ScanProgress = { status: string; progress: number }

export async function scanReceipt(
  imageDataUrl: string,
  onProgress?: (p: ScanProgress) => void,
): Promise<ReceiptItem[]> {
  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      onProgress?.({ status: m.status, progress: m.progress ?? 0 })
    },
  })

  try {
    const { data } = await worker.recognize(imageDataUrl)
    const items = parseReceiptText(data.text)
    if (items.length === 0) {
      throw new Error('No items found — try a clearer, well-lit photo of the receipt')
    }
    return items
  } finally {
    await worker.terminate()
  }
}
