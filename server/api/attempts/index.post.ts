import { assertSameOrigin, noStore } from '../../utils/request'
import { createAttempt } from '../../utils/db'
import { assertStartTime, assertTimezone } from '../../utils/types'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ startedAt?: unknown, timezone?: unknown, requestId?: unknown }>(event)
  assertStartTime(body?.startedAt); assertTimezone(body?.timezone)
  if (typeof body?.requestId !== 'string' || body.requestId.length < 8) throw createError({ statusCode: 400, statusMessage: 'Некоректний ідентифікатор запиту.' })
  noStore(event)
  return createAttempt(body.startedAt as number, body.timezone as string, body.requestId)
})
