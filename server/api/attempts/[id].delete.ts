import { deleteHistoryAttempt } from '../../utils/db'
import { assertSameOrigin, noStore } from '../../utils/request'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ requestId?: unknown }>(event)
  if (typeof body?.requestId !== 'string' || body.requestId.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Некоректний ідентифікатор запиту.' })
  }
  noStore(event)
  return await deleteHistoryAttempt(getRouterParam(event, 'id')!, body.requestId)
})
