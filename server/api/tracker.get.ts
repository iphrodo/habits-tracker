import { trackerState } from '../utils/db'
import { noStore } from '../utils/request'

export default defineEventHandler(async (event) => { noStore(event); return await trackerState() })
