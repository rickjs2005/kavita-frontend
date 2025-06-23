// Indica que este componente será usado no lado do cliente (necessário em projetos Next.js com uso de interatividade)
"use client";

// Importa o tipo 'Product' definido em outro arquivo. Esse tipo descreve a estrutura dos dados de um produto.
import { Product } from "../../types/product";

// Define as propriedades (props) que o componente vai receber
// Neste caso, o componente espera receber um objeto do tipo 'Product'
interface AddToCartButtonProps {
    product: Product;
}

// Declara o componente de botão, recebendo um produto como propriedade
const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product }) => {

    // Função que será executada quando o botão for clicado
    const handleAddToCart = () => {
        // Aqui poderia ir a lógica para adicionar o produto ao carrinho (usando contexto, Redux, etc.)
        // Neste exemplo, está apenas exibindo o produto no console como simulação
        console.log("Produto adicionado ao carrinho:", product);
    };

    // Retorna o botão estilizado com Tailwind CSS
    // Quando clicado, executa a função 'handleAddToCart'
    return (
        <button
            onClick={handleAddToCart} // Define a função que será chamada ao clicar no botão
            className="mt-4 w-full py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-800"
            // mt-4: margem superior
            // w-full: ocupa toda a largura do elemento pai
            // py-2: padding vertical
            // rounded-md: cantos arredondados
            // text-white: texto branco
            // font-semibold: fonte em negrito
            // bg-green-600: fundo verde
            // hover:bg-green-800: muda o fundo quando o mouse passa por cima
        >
            Adicionar ao Carrinho
        </button>
    );
};

// Exporta o componente para que ele possa ser usado em outros lugares do projeto
export default AddToCartButton;
// O componente 'AddToCartButton' é um botão estilizado que, ao ser clicado, simula a adição de um produto ao carrinho de compras.
// Ele recebe um produto como propriedade e exibe uma mensagem no console quando clicado.