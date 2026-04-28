const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

export async function getContratos() {
  if (USE_MOCK) {
    const { Contratos } = await import("@/mocks/contratos")
    return Contratos

  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contratos`)
  return res.json()
}