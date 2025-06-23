// Esta é a página inicial do painel de administração

export default function AdminDashboard() {
  return (
    <div>
      {/* Título grande para dar boas-vindas ao admin */}
      <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Painel Admin</h2>

      {/* Mensagem explicando o que o admin pode fazer */}
      <p className="text-gray-700">
        Use o menu à esquerda para gerenciar seu site.
      </p>
    </div>
  );
}
// Aqui é a página inicial do painel de administração
// O admin verá uma mensagem de boas-vindas e instruções sobre como usar o painel