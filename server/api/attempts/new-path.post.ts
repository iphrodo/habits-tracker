import { newPath } from '../../utils/db'
import { assertSameOrigin, noStore } from '../../utils/request'
import { assertStartTime, assertTimezone } from '../../utils/types'

const triggers = ['stress', 'coffee', 'alcohol', 'after_food', 'company', 'boredom', 'habit', 'other'] as const
export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ startedAt?: unknown, timezone?: unknown, version?: unknown, trigger?: unknown, rankKey?: unknown, requestId?: unknown }>(event)
  assertStartTime(body?.startedAt); assertTimezone(body?.timezone)
  if (!Number.isInteger(body?.version) || typeof body?.requestId !== 'string' || body.requestId.length < 8 || (body.trigger !== undefined && !triggers.includes(body.trigger as typeof triggers[number])) || (body.rankKey !== undefined && (typeof body.rankKey !== 'string' || body.rankKey.length > 80))) throw createError({ statusCode: 400, statusMessage: 'Некоректні дані нового шляху.' })
  noStore(event)
  return await newPath(body.startedAt as number, body.timezone as string, body.version as number, body.trigger as typeof triggers[number] | undefined, body.rankKey as string | undefined, body.requestId)
})
