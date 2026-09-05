import { updateSettings } from '../utils/db'
import { assertSameOrigin, noStore } from '../utils/request'
import { parseSettingsUpdate } from '../utils/settings'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<Record<string, unknown>>(event)
  const input = parseSettingsUpdate(body)
  if (!input) throw createError({ statusCode: 400, statusMessage: 'Перевірте причину, денну суму та повторіть.' })
  noStore(event)
  return await updateSettings(input.personalReason, input.dailySmokingCost, input.requestId)
})
