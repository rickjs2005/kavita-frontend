// Importa o cabeçalho (barra de cima) do painel admin
import AdminHeader from "../../components/admin/AdminHeader";

// Importa a barra lateral (menu da esquerda) do painel admin
import AdminSidebar from "../../components/admin/AdminSidebar";

// Aqui colocamos o título da aba do navegador
export const metadata = {
  title: "Admin | Kavita", // Vai aparecer na aba do navegador
};

// Função principal que monta o layout da página do admin
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // A tela inteira vai ocupar 100% da altura, com fundo cinza claro
    <div className="min-h-screen flex bg-gray-100">
      
      {/* Menu lateral que só aparece em telas médias pra cima (computador) */}
      <aside className="w-64 bg-white shadow-lg hidden md:block">
        <AdminSidebar />
      </aside>

      {/* Parte principal da tela: cabeçalho + conteúdo */}
      <div className="flex flex-col flex-1">
        
        {/* Barra de cima com logo, nome, botão de sair etc. */}
        <AdminHeader />

        {/* Aqui vai aparecer o conteúdo que for passado (produtos, serviços, pedidos...) */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
