export function createRefreshCoordinator(refresh: () => Promise<void>, updateClock: () => void) {
  let inFlight: Promise<void> | undefined

  return {
    run() {
      updateClock()
      if (!inFlight) {
        inFlight = refresh().finally(() => {
          inFlight = undefined
        })
      }
      return inFlight
    },
    isRefreshing() {
      return Boolean(inFlight)
    },
  }
}
