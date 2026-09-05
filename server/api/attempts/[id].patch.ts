import { assertSameOrigin, noStore } from '../../utils/request'
import { updateAttempt } from '../../utils/db'
import { assertStartTime, assertTimezone } from '../../utils/types'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ startedAt?: unknown, timezone?: unknown, version?: unknown, requestId?: unknown }>(event)
  assertStartTime(body?.startedAt); assertTimezone(body?.timezone)
  if (!Number.isInteger(body?.version) || typeof body?.requestId !== 'string') throw createError({ statusCode: 400, statusMessage: 'Некоректні дані оновлення.' })
  noStore(event)
  return await updateAttempt(getRouterParam(event, 'id')!, body.startedAt as number, body.timezone as string, body.version as number, body.requestId)
})
