import { markWisdomRead } from '../../utils/db'
import { assertSameOrigin, noStore } from '../../utils/request'
import { assertLocalDate, assertTimezone } from '../../utils/types'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ date?: unknown, wisdomId?: unknown, timezone?: unknown, requestId?: unknown }>(event)
  assertLocalDate(body?.date)
  assertTimezone(body?.timezone)
  if (typeof body?.wisdomId !== 'string' || !/^[a-z0-9-]{3,80}$/.test(body.wisdomId) || typeof body.requestId !== 'string' || body.requestId.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Некоректні дані картки.' })
  }
  noStore(event)
  return markWisdomRead(body.date, body.wisdomId, body.timezone, body.requestId)
})
