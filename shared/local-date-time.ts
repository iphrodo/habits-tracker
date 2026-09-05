export interface LocalDateTimeFields {
  date: string
  time: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function timestampToLocalDateTime(timestamp: number): LocalDateTimeFields {
  const value = new Date(timestamp)
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  }
}

export function localDateTimeToTimestamp(date: string, time: string, unchangedTimestamp?: number) {
  if (unchangedTimestamp !== undefined) {
    const original = timestampToLocalDateTime(unchangedTimestamp)
    if (original.date === date && original.time === time) return unchangedTimestamp
  }
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dateMatch || !timeMatch) return Number.NaN

  const [, yearText, monthText, dayText] = dateMatch
  const [, hourText, minuteText] = timeMatch
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return Number.NaN

  const value = new Date(year, month - 1, day, hour, minute, 0, 0)
  if (
    value.getFullYear() !== year
    || value.getMonth() !== month - 1
    || value.getDate() !== day
    || value.getHours() !== hour
    || value.getMinutes() !== minute
  ) return Number.NaN

  return value.getTime()
}
