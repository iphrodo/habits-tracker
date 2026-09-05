import { dailyWisdom } from '../../utils/db'
import { noStore } from '../../utils/request'
import { assertTimezone } from '../../utils/types'

export default defineEventHandler(async (event) => {
  const timezone = getQuery(event).timezone
  assertTimezone(timezone)
  noStore(event)
  return await dailyWisdom(timezone)
})
