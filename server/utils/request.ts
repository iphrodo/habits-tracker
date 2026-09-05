export function assertSameOrigin(event: Parameters<typeof getHeader>[0]) {
  const origin = getHeader(event, 'origin')
  const trustedOrigin = useRuntimeConfig().trustedOrigin
  if (trustedOrigin && origin !== trustedOrigin) {
    throw createError({ statusCode: 403, statusMessage: 'Запит відхилено.' })
  }
}

export function noStore(event: Parameters<typeof setResponseHeader>[0]) {
  setResponseHeader(event, 'Cache-Control', 'no-store')
}
