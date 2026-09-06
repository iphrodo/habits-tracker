import { createCravingEvent } from '../utils/db'
import { assertSameOrigin, noStore } from '../utils/request'

const triggers = ['stress', 'coffee', 'alcohol', 'after_food', 'company', 'boredom', 'habit', 'other'] as const
const copingMethods = ['chakra', 'water', 'walk', 'changed_activity', 'waited', 'talked', 'other', 'not_easier'] as const
export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ trigger?: unknown, rankKey?: unknown, requestId?: unknown, intensity?: unknown, copingMethod?: unknown }>(event)
  const intensity = body?.intensity
  if (!triggers.includes(body?.trigger as typeof triggers[number]) || typeof body?.requestId !== 'string' || body.requestId.length < 8 || (body.rankKey !== undefined && (typeof body.rankKey !== 'string' || body.rankKey.length > 80)) || (intensity !== undefined && (!Number.isInteger(intensity) || Number(intensity) < 1 || Number(intensity) > 5)) || (body?.copingMethod !== undefined && !copingMethods.includes(body.copingMethod as typeof copingMethods[number]))) throw createError({ statusCode: 400, statusMessage: 'Некоректні дані моменту.' })
  noStore(event)
  return intensity === undefined && body?.copingMethod === undefined
    ? await createCravingEvent(body.trigger as typeof triggers[number], body.rankKey as string | undefined, body.requestId)
    : await createCravingEvent(body.trigger as typeof triggers[number], body.rankKey as string | undefined, body.requestId, intensity as number | undefined, body.copingMethod as string | undefined)
})
