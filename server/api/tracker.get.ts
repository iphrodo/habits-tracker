import { trackerState } from '../utils/db'
import { noStore } from '../utils/request'

export default defineEventHandler((event) => { noStore(event); return trackerState() })
