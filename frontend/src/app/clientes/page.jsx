import { clientesMock } from "@/mocks/clientes";

export default function ClientesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      <ul className="space-y-3">
        {clientesMock.map((cliente) => (
          <li key={cliente.id_cliente} className="border p-4 rounded">
            <p className="font-semibold">{cliente.nome_instituicao}</p>
            <p>{cliente.cidade}</p>
            <p>Status: {cliente.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}