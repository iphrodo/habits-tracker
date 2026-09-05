import { createCravingEvent } from '../utils/db'
import { assertSameOrigin, noStore } from '../utils/request'

const triggers = ['stress', 'coffee', 'alcohol', 'after_food', 'company', 'boredom', 'habit', 'other'] as const
export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ trigger?: unknown, rankKey?: unknown, requestId?: unknown }>(event)
  if (!triggers.includes(body?.trigger as typeof triggers[number]) || typeof body?.requestId !== 'string' || body.requestId.length < 8 || (body.rankKey !== undefined && (typeof body.rankKey !== 'string' || body.rankKey.length > 80))) throw createError({ statusCode: 400, statusMessage: 'Некоректний тригер.' })
  noStore(event)
  return await createCravingEvent(body.trigger as typeof triggers[number], body.rankKey as string | undefined, body.requestId)
})
