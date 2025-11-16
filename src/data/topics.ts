const topics = [
    {
        title: 'Sobre Nós',
        description: 'Informações sobre a loja.',
        content: [
            'Quem somos',
            'A kavita foi lançada em 2010 para atender às necessidades de clientes em todo o Brasil que precisam ter acesso rápido e prático para adquirir produtos para o agronegócio.',
            'Através da Loja Agropecuária, é possível comprar, com todo conforto e segurança que um E-commerce oferece, artigos para fazenda, implementos agrícolas, máquinas e equipamentos para agricultura e pecuária, além de uma vasta gama de produtos para saúde e alimentação animal.',
            'Contamos com uma variada lista de fornecedores e marcas renomadas para oferecer ao consumidor final uma ampla linha de produtos de qualidade comprovada e com ótimas condições de pagamento.',
            'Nosso Portal reúne em um só lugar tudo o que você precisa para tornar as suas compras ainda mais práticas. E nossa equipe é treinada para oferecer aos nossos clientes toda a atenção necessária durante e também no pós-venda.',
            'Nossa Missão: Contribuir para o desenvolvimento de nossos clientes.',
            'Visão: Ser líder em vendas atingindo elevados padrões de excelência.',
            'Nossos Valores:',
            '• Integridade acima de tudo.',
            '• Simplicidade com qualidade.',
            '• Comprometimento e trabalho duro em busca de resultados.',
            '• Dinamismo e agilidade no dia-a-dia.',
            '• Empreendedorismo e crescimento no mercado.',
            'Nossos Produtos:',
            'Artigos para Fazenda: Ferraduras, Selaria, Botas e Botinas, Arames, Produtos veterinários, Nutrição Animal, Identificação Animal, Ferragens, Ferramentas, Cerca Elétrica.',
            'Implementos Agrícolas: Sementes, Produtos para Colheita, Defensivos Agrícolas, Artigos para Irrigação, Adubos Foliares, Jardinagem, Pulverização, Formicidas, Herbicidas, Inseticidas, Raticidas.',
            'Máquina e Equipamentos: Irrigadores, Correias para Máquinas, Moto Serra, Motor Elétrico, Ordenhadeira, Pulverizadores, Roçadeiras, Cerca Elétrica, Equipamentos de Segurança.',
            'Linha Pet: Produtos Veterinários, Acessórios Pet, Nutrição e Saúde Animal.',
            'Contato:',
            'Rua Joaquim Murtinho, 1269 - A, Bairro: Centro, Perdões - MG, Cep: 37.260-000.',
            'Navegue em nossa Loja Virtual, conheça todos os nossos produtos e em caso de dúvidas estaremos prontos para prestar sempre o melhor atendimento.',
            'Bons Negócios!',
        ]
    },
    { 
        title: 'Produtos',
        description: 'Produtos de confiança e qualidade.',
        content: [
            '• As embalagens dos produtos são sempre mencionadas na descrição dos produtos e são enviadas com cuidado para que não chegue avariada.',
            '• A Kavita Agropecuária trabalha com produtos de qualidade e confiança, com marcas renomadas no mercado, garantindo a satisfação do cliente.',
            '• Nossos produtos são divididos em categorias, facilitando a busca do cliente por um produto específico.',
            '• Caso não encontre o produto desejado, entre em contato conosco e faremos o possível para atendê-lo.',   
        ] 
    },
    { 
        title: 'Política de Entrega', 
        description: 'Detalhes sobre nossa entrega.',
        content: [
            '• A entrega é feita por transportadoras contratadas pela Kavita Agropecuária.',
            '• O prazo de entrega é informado no momento da compra, e o cliente pode acompanhar o status do pedido através do site.',
            '• O prazo de entrega pode variar de acordo com a região de entrega.',
            '• Em caso de atraso na entrega, entre em contato conosco para que possamos verificar o ocorrido.',
            '• Em caso de dúvidas sobre a entrega, entre em contato conosco.',
        ]
    },
    { 
        title: 'Como Comprar', 
        description: 'Guia para realizar sua compra.',
        content: [
            '• Para realizar uma compra na Kavita Agropecuária, siga os passos abaixo:',
            '1. Navegue pelo site e encontre o produto desejado.',
            '2. Clique no produto para ver mais detalhes.',
            '3. Selecione a quantidade desejada e clique em "Comprar".',
            '4. O produto será adicionado ao carrinho de compras.',
            '5. Para finalizar a compra, clique em "Finalizar Compra".',
            '6. Preencha seus dados de entrega e escolha a forma de pagamento.',
            '7. Após a confirmação do pagamento, seu pedido será processado e enviado.',
            '8. Em caso de dúvidas sobre a compra, entre em contato conosco.',
        ]
    },
    { 
        title: 'Compra Segura', 
        description: 'Saiba como garantimos segurança.',
        content: [
            '• A Kavita Agropecuária garante a segurança de suas informações pessoais e de pagamento.',
            '• Utilizamos certificados de segurança para proteger seus dados.',
            '• Todas as transações são criptografadas e processadas por meios seguros.',
            '• Não armazenamos informações de cartão de crédito em nosso sistema.',
            '• Em caso de dúvidas sobre a segurança da compra, entre em contato conosco.',
        ]
    },
    { 
        title: 'Troca e Devolução', 
        description: 'Políticas de troca e devolução.',
        content: [
            '• A Kavita Agropecuária aceita a troca ou devolução de produtos em até 7 dias corridos após o recebimento.',
            '• Para solicitar a troca ou devolução, entre em contato conosco e informe o motivo.',
            '• O produto deve ser devolvido na embalagem original, sem sinais de uso ou  danos.',
            '• O custo do frete de devolução é de responsabilidade do cliente.',
            '• Em caso de dúvidas sobre a troca ou devolução, entre em contato conosco.',
        ]
    },
    { 
        title: 'Privacidade e Segurança', 
        description: 'Como cuidamos de seus dados.',
        content: [
            '• A Kavita Agropecuária respeita a privacidade de seus clientes e se compromete a proteger suas informações pessoais.',
            '• Utilizamos certificados de segurança para proteger seus dados.',
            '• Não compartilhamos suas informações com terceiros sem sua autorização.',
            '• Em caso de dúvidas sobre a privacidade e segurança de seus dados, entre em contato conosco.',
        ]
    },
    { 
        title: 'Cupom de Desconto', 
        description: 'Use nossos cupons e economize.',
        content: [
            '• A Kavita Agropecuária oferece cupons de desconto para seus clientes.',
            '• Os cupons podem ser utilizados no momento da compra para obter descontos especiais.',
            '• Para utilizar um cupom de desconto, insira o código do cupom no campo indicado durante o processo de compra.',
            '• Os cupons de desconto são válidos por tempo limitado e podem ter restrições de uso.',
            '• Em caso de dúvidas sobre o uso de cupons de desconto, entre em contato conosco.',
        ]
    },
    { 
        title: 'Pagamentos', 
        description: 'Métodos de pagamento disponíveis.',
        content: [
            '• A Kavita Agropecuária aceita os seguintes métodos de pagamento:',
            '• Cartão de Crédito: Visa, Mastercard, American Express, Elo, Hipercard, Diners Club.',
            '• Boleto Bancário: Pagável em qualquer agência bancária ou casa lotérica.',
            '• Transferência Bancária: Realize a transferência para nossa conta e envie o comprovante.',
            '• PagSeguro: Realize o pagamento de forma segura através do PagSeguro.',
            '• Em caso de dúvidas sobre os métodos de pagamento, entre em contato conosco.',
        ]
    },
    { title: 'Contatos de nossos colaboradores', description: 'Entre em contato com nossa equipe.' },
];

export default topics;
