import { supabase } from './supabase'

export interface RegisteredPlayer {
  phone: string
  name: string
  addedAt: string
}

export function normalise(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function getRegistry(): Promise<RegisteredPlayer[]> {
  const { data } = await supabase.from('registered_players').select('*').order('name')
  return (data ?? []).map((r) => ({ phone: r.phone, name: r.name, addedAt: r.added_at }))
}

export async function lookupPlayer(phone: string): Promise<RegisteredPlayer | undefined> {
  const { data } = await supabase
    .from('registered_players')
    .select('*')
    .eq('phone', normalise(phone))
    .maybeSingle()
  if (!data) return undefined
  return { phone: data.phone, name: data.name, addedAt: data.added_at }
}

export async function addPlayer(phone: string, name: string): Promise<RegisteredPlayer> {
  const key = normalise(phone)
  const entry = { phone: key, name: name.trim(), added_at: new Date().toISOString() }
  await supabase.from('registered_players').upsert(entry, { onConflict: 'phone' })
  return { phone: key, name: name.trim(), addedAt: entry.added_at }
}

export async function removePlayer(phone: string): Promise<void> {
  await supabase.from('registered_players').delete().eq('phone', normalise(phone))
}
