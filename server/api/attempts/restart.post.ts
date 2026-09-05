import { assertSameOrigin, noStore } from '../../utils/request'
import { restartAttempt } from '../../utils/db'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ requestId?: unknown }>(event)
  if (typeof body?.requestId !== 'string' || body.requestId.length < 8) throw createError({ statusCode: 400, statusMessage: 'Некоректний ідентифікатор запиту.' })
  noStore(event)
  return restartAttempt(body.requestId)
})
