import { Clientes } from "@/lib/mocks";

export default function clientes() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      <ul className="space-y-3">
        {Clientes.map((cliente) => (
          <li key={cliente.id} className="border p-4 rounded">
            <p className="font-semibold">{cliente.nome}</p>
            <p>{cliente.tipo}</p>
            <p>Status: {cliente.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}