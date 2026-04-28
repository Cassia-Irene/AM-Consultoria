const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

export async function getVisitas() {
  if (USE_MOCK) {
    const { Visitas } = await import("@/mocks/visitas")
    return Visitas
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/visitas`)
  return res.json()
}