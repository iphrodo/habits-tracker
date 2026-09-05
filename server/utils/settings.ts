export interface SettingsUpdateInput {
  personalReason: string | null
  dailySmokingCost: number
  requestId: string
}

export function parseSettingsUpdate(body: Record<string, unknown> | null | undefined): SettingsUpdateInput | null {
  const personalReason = body?.personalReason
  const dailySmokingCost = body?.dailySmokingCost
  const requestId = body?.requestId
  if (personalReason !== null && (typeof personalReason !== 'string' || personalReason.trim().length > 280)) return null
  if (typeof dailySmokingCost !== 'number' || !Number.isFinite(dailySmokingCost) || dailySmokingCost < 0 || dailySmokingCost > 10_000) return null
  if (typeof requestId !== 'string' || requestId.length < 8) return null
  return { personalReason: personalReason?.trim() || null, dailySmokingCost, requestId }
}
