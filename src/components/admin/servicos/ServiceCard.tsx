import { Service } from "@/types/service"; // Tipo que define como é um serviço
import DeleteButton from "@/components/buttons/DeleteButton"; // Botão vermelho para apagar

// Dizemos que o componente precisa de um serviço e das funções de remover e editar
interface Props {
  servico: Service; // O serviço que vamos mostrar
  onRemover: (id: number) => void; // Quando clicar em remover
  onEditar: (servico: Service) => void; // Quando clicar em editar
}

// Componente do cartão que mostra um serviço
const ServiceCard = ({ servico, onRemover, onEditar }: Props) => {
  return (
    <div className="bg-white p-4 shadow rounded">
      {/* Imagem do serviço (pode ser do colaborador) */}
      <img
        src={servico.imagem}
        alt={servico.nome}
        className="w-full h-40 object-cover mb-2 rounded"
      />

      {/* Nome do serviço (ou do colaborador) */}
      <h2 className="font-bold">{servico.nome}</h2>

      {/* Descrição do serviço */}
      <p className="text-sm text-gray-600">{servico.descricao}</p>

      {/* Cargo da pessoa que faz o serviço */}
      <p className="text-sm text-gray-500">Cargo: {servico.cargo}</p>

      {/* Especialidade do serviço (ex: veterinário, agrônomo...) */}
      <p className="text-sm text-gray-500">Especialidade: {servico.especialidade_nome}</p>

      {/* Link para abrir o WhatsApp da pessoa que faz o serviço */}
      <a
        href={`https://wa.me/${servico.whatsapp}`} // Vai para o WhatsApp com o número
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 text-sm"
      >
        WhatsApp: {servico.whatsapp}
      </a>

      {/* Botões de ação: Editar e Remover */}
      <div className="mt-4 flex gap-2">
        {/* Botão azul de editar */}
        <button
          onClick={() => onEditar(servico)}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Editar
        </button>

        {/* Botão de apagar com confirmação */}
        <DeleteButton onConfirm={() => onRemover(servico.id)} />
      </div>
    </div>
  );
};

export default ServiceCard; // Exportamos para poder usar esse cartão em outras páginas
// Aqui usamos o DeleteButton para o botão de remover
// O DeleteButton é um botão vermelho que pede confirmação antes de apagar algo