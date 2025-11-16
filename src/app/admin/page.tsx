// app/admin/page.tsx
export default function AdminDashboard() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          Bem-vindo ao Painel Admin
        </h2>
        <p className="text-gray-600 mt-1">
          Use o menu para gerenciar produtos, pedidos, destaques e serviços.
        </p>
      </div>

      {/* Cards de status (grid responsiva) */}
      <section className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-sm text-gray-500">Produtos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
          <span className="text-xs text-gray-400">Total cadastrados</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-sm text-gray-500">Pedidos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
          <span className="text-xs text-gray-400">Últimos 7 dias</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-sm text-gray-500">Destaques</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
          <span className="text-xs text-gray-400">Ativos na home</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 sm:p-5">
          <p className="text-sm text-gray-500">Serviços</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
          <span className="text-xs text-gray-400">Cadastrados</span>
        </div>
      </section>

      {/* Atalhos rápidos (stack em mobile, grid em telas maiores) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <a
          href="/admin/produtos"
          className="bg-[#359293] text-white rounded-xl px-4 py-3 sm:py-4 shadow hover:bg-[#2b797a] transition flex items-center justify-between"
        >
          <span className="font-semibold">Gerenciar Produtos</span>
          <span>📦</span>
        </a>
        <a
          href="/admin/pedidos"
          className="bg-white rounded-xl px-4 py-3 sm:py-4 shadow hover:shadow-md transition flex items-center justify-between"
        >
          <span className="font-semibold text-gray-900">Ver Pedidos</span>
          <span>🧾</span>
        </a>
        <a
          href="/admin/destaques"
          className="bg-white rounded-xl px-4 py-3 sm:py-4 shadow hover:shadow-md transition flex items-center justify-between"
        >
          <span className="font-semibold text-gray-900">Destaques</span>
          <span>⭐</span>
        </a>
        <a
          href="/admin/servicos"
          className="bg-white rounded-xl px-4 py-3 sm:py-4 shadow hover:shadow-md transition flex items-center justify-between"
        >
          <span className="font-semibold text-gray-900">Serviços</span>
          <span>🛠️</span>
        </a>
      </section>

      {/* Lista/atividade (vira cards no mobile) */}
      <section className="bg-white rounded-2xl shadow">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Atividade recente
          </h3>
          <p className="text-sm text-gray-500">Últimas ações no painel</p>
        </div>

        {/* Tabela em >= md | Cards em < md */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead className="text-sm text-gray-500">
              <tr className="[&_th]:px-6 [&_th]:py-3">
                <th>Ação</th>
                <th>Quem</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y">
              <tr className="[&_td]:px-6 [&_td]:py-3">
                <td>—</td><td>—</td><td>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="md:hidden p-4 sm:p-5 space-y-3">
          <div className="rounded-xl border p-3">
            <p className="font-medium text-gray-900">—</p>
            <p className="text-sm text-gray-500">Quem: —</p>
            <p className="text-sm text-gray-500">Quando: —</p>
          </div>
        </div>
      </section>
    </div>
  );
}
