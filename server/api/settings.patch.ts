import { updateSettings } from '../utils/db'
import { assertSameOrigin, noStore } from '../utils/request'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ personalReason?: unknown, dailySmokingCost?: unknown, requestId?: unknown }>(event)
  const personalReason = body?.personalReason
  if (personalReason !== null && (typeof personalReason !== 'string' || personalReason.trim().length > 280)) throw createError({ statusCode: 400, statusMessage: 'Причина має містити до 280 символів.' })
  if (typeof body?.dailySmokingCost !== 'number' || !Number.isFinite(body.dailySmokingCost) || body.dailySmokingCost < 0 || body.dailySmokingCost > 10_000) throw createError({ statusCode: 400, statusMessage: 'Вкажіть коректну денну суму.' })
  if (typeof body?.requestId !== 'string' || body.requestId.length < 8) throw createError({ statusCode: 400, statusMessage: 'Некоректний ідентифікатор запиту.' })
  noStore(event)
  return await updateSettings(personalReason?.trim() || null, body.dailySmokingCost, body.requestId)
})
