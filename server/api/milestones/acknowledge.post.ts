import { assertSameOrigin, noStore } from '../../utils/request'
import { acknowledgeMilestones } from '../../utils/db'
import { MILESTONES } from '../../utils/types'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ days?: unknown, requestId?: unknown }>(event)
  if (!Array.isArray(body?.days) || body.days.some((day) => !MILESTONES.includes(day)) || typeof body.requestId !== 'string') throw createError({ statusCode: 400, statusMessage: 'Некоректні досягнення.' })
  noStore(event)
  return await acknowledgeMilestones(body.days, body.requestId)
})
