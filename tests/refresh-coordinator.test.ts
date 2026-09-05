import { describe, expect, it, vi } from 'vitest'
import { createRefreshCoordinator } from '../shared/refresh-coordinator'

describe('foreground refresh coordinator', () => {
  it('updates the local clock immediately and deduplicates concurrent events', async () => {
    let resolveRefresh!: () => void
    const refresh = vi.fn(() => new Promise<void>((resolve) => { resolveRefresh = resolve }))
    const updateClock = vi.fn()
    const coordinator = createRefreshCoordinator(refresh, updateClock)

    const visibility = coordinator.run()
    const focus = coordinator.run()

    expect(updateClock).toHaveBeenCalledTimes(2)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(coordinator.isRefreshing()).toBe(true)
    expect(focus).toBe(visibility)

    resolveRefresh()
    await visibility
    expect(coordinator.isRefreshing()).toBe(false)
  })

  it('allows a retry after a failed refresh', async () => {
    const refresh = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined)
    const coordinator = createRefreshCoordinator(refresh, () => undefined)

    await expect(coordinator.run()).rejects.toThrow('offline')
    await expect(coordinator.run()).resolves.toBeUndefined()
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
