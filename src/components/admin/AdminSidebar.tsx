import Link from 'next/link'; // Usamos isso para criar links entre páginas

// Este componente mostra a barra lateral (menu) do admin
export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white shadow h-screen p-6">
      {/* Título do menu lateral */}
      <h1 className="text-xl font-bold mb-6 text-[#359293]">Painel Admin</h1>

      {/* Aqui ficam os botões para navegar entre as páginas */}
      <nav className="flex flex-col gap-4">
        {/* Cada linha leva para uma página diferente do admin */}
        <Link href="/admin">🏠 Dashboard</Link>
        <Link href="/admin/produtos">📦 Produtos</Link>
        <Link href="/admin/destaques">⭐ Destaques</Link>
        <Link href="/admin/pedidos">🧾 Pedidos</Link>
        <Link href="/admin/servicos">🛠️ Serviços</Link> {/* Link para a página de serviços */}
      </nav>
    </aside>
  );
}
// Explicação do código:
// - O componente `AdminSidebar` cria uma barra lateral com links para diferentes páginas do painel do admin.
// - Usamos o componente `Link` do Next.js para criar links que levam a outras páginas do admin.
// - Cada link tem um emoji para deixar mais visual e fácil de entender.