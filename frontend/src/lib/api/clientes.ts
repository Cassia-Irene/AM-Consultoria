const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

export async function getClientes() {
  if (USE_MOCK) {
    const { Clientes } = await import("@/mocks/clientes")
    return Clientes
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes`)
  return res.json()
}