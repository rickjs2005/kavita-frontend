// Informa ao Next.js que este componente será renderizado no cliente (importante para usar hooks como useRouter)
'use client';

// Importa o hook 'useRouter' do Next.js para navegar entre páginas
import { useRouter } from 'next/navigation';

// Define as propriedades (props) que o botão pode receber
type CloseButtonProps = {
  onClose?: () => void; // Função opcional que será chamada ao clicar no botão (ação customizada)
  className?: string;   // Permite passar uma classe CSS personalizada
};

// Cria o componente funcional 'CloseButton', que recebe as props definidas acima
const CloseButton: React.FC<CloseButtonProps> = ({ onClose, className }) => {
  const router = useRouter(); // Cria uma instância do roteador para controlar a navegação

  // Função chamada quando o botão é clicado
  const handleClose = () => {
    if (onClose) {
      // Se a prop 'onClose' foi passada, executa essa função
      onClose();
    } else {
      // Caso contrário, executa o comportamento padrão: voltar para a página anterior
      router.back();
    }
  };

  // Retorna o botão visual na tela
  return (
    <button
      onClick={handleClose} // Define o que acontece ao clicar no botão
      className={`text-gray-500 hover:text-gray-800 text-4xl ${className || ''}`}
      // text-gray-500: cor do texto padrão
      // hover:text-gray-800: muda a cor quando o mouse passa por cima
      // text-4xl: define o tamanho grande do "×"
      // ${className || ''}: permite adicionar classes extras via props
      aria-label="Fechar" // Ajuda leitores de tela a entender que esse botão fecha algo
    >
      × {/* Símbolo "X" que representa o botão de fechar */}
    </button>
  );
};

// Exporta o componente para que possa ser usado em outros lugares do projeto
export default CloseButton;
// O componente 'CloseButton' é um botão estilizado que, ao ser clicado, executa uma ação de fechar ou voltar para a página anterior.
// Ele pode receber uma função customizada para ser executada ao fechar, ou simplesmente voltar à página anterior se nenhuma função for passada.
// Ele também aceita classes CSS adicionais para personalização visual.