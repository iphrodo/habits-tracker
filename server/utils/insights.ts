export interface CravingEventForInsight { trigger: string, intensity: number | null, copingMethod: string | null }
export interface CravingInsight { kind: 'trigger' | 'intensity-trigger' | 'coping', key: string, count: number }

function uniqueLeader(values: Array<string | null | undefined>): { key: string, count: number } | null {
  const counts = new Map<string, number>()
  for (const value of values) if (value) counts.set(value, (counts.get(value) || 0) + 1)
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  if (!ranked[0] || ranked[0][1] === ranked[1]?.[1]) return null
  return { key: ranked[0][0], count: ranked[0][1] }
}

/** One conservative, descriptive pattern. Ties intentionally produce no claim. */
export function selectCravingInsight(events: CravingEventForInsight[]): CravingInsight | null {
  if (events.length < 5) return null
  const trigger = uniqueLeader(events.map(event => event.trigger))
  if (trigger) return { kind: 'trigger', ...trigger }
  const maximum = Math.max(...events.map(event => event.intensity || 0))
  if (maximum > 0) {
    const intenseTrigger = uniqueLeader(events.filter(event => event.intensity === maximum).map(event => event.trigger))
    if (intenseTrigger) return { kind: 'intensity-trigger', ...intenseTrigger }
  }
  const coping = uniqueLeader(events.map(event => event.copingMethod))
  return coping ? { kind: 'coping', ...coping } : null
}
