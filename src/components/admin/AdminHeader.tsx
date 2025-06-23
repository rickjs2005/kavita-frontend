"use client"; // Isso diz que o código será executado no navegador (lado do cliente)

import { useRouter } from "next/navigation"; // Usado para mudar de página

// Esse é o cabeçalho do painel do admin, com o botão de "Sair"
export default function AdminHeader() {
  const router = useRouter(); // Usamos isso para redirecionar a pessoa

  // Função chamada quando clicamos no botão de sair
  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // Apaga o token do admin (o crachá)
    router.push("/admin/login"); // Leva o admin de volta para a tela de login
  };

  return (
    <div className="flex justify-end p-4">
      {/* Botão para sair do sistema */}
      <button
        onClick={handleLogout}
        className="text-red-600 hover:underline font-medium"
      >
        Sair
      </button>
    </div>
  );
}
// Assim, quando o admin clicar em "Sair", ele será desconectado e levado de volta para a tela de login.
// O botão fica no canto direito do cabeçalho, fácil de encontrar.