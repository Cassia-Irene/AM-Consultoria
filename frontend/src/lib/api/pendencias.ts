const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

export async function getPendencias() {
  if (USE_MOCK) {
    const { Pendencias } = await import("@/mocks/pendencias")
    return Pendencias
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pendencias`)
  return res.json()
}