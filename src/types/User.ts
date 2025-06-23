export interface User {
    id?: number; // opcional, pois pode não existir ainda (por exemplo, durante o cadastro)
    nome: string;
    email: string;
    senha: string;
    endereco?: string;
    data_nascimento?: string; // ou Date, conforme sua necessidade
    telefone?: string;
    pais: string; // Novo campo
    estado: string; // Novo campo
    cidade: string; // Novo campo
    cep: string; // Novo campo
    ponto_referencia?: string; // Novo campo (opcional)
    criado_em?: Date; // opcional, geralmente preenchido pelo backend
}
