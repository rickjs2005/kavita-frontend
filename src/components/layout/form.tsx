'use client'; // Habilita funcionalidades do lado do cliente (como useState)

import { useState } from "react";
import { FormData } from "../../types/formData"; // Importa o tipo dos dados do formulário

const Form = () => {
    // Estado que armazena os dados digitados pelo usuário
    const [formData, setFormData] = useState<FormData>({
        assunto: '',
        nome: '',
        email: '',
        telefone: '',
        estado: '',
        cidade: '',
        corrego: '',
        mensagem: '',
    });

    // Estado para controlar se o formulário foi enviado com sucesso
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    // Função chamada sempre que o usuário digita em um campo
    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        // Atualiza o campo alterado com o novo valor
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Função chamada ao enviar o formulário
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Evita o recarregamento da página
        console.log('Formulário enviado:', formData); // Exibe os dados no console

        setIsSubmitted(true); // Mostra mensagem de sucesso

        // Limpa todos os campos após o envio
        setFormData({
            assunto: '',
            nome: '',
            email: '',
            telefone: '',
            estado: '',
            cidade: '',
            corrego: '',
            mensagem: '',
        });

        // Aqui você pode adicionar a lógica para enviar os dados para um servidor (via fetch ou axios)
    };

    return (
        <div>
            {/* Caixa com sombra e padding */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold text-[#359293] mb-6">Entre em contato</h2>
                
                {/* Se enviado, mostra mensagem de sucesso */}
                {isSubmitted ? (
                    <div className="text-center text-green-600 mb-6">
                        <p className="text-lg">Sua mensagem foi enviada com sucesso! Logo entraremos em contato.</p>
                    </div>
                ) : (
                    // Formulário real
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Campos em duas colunas em telas maiores */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Campo Assunto */}
                            <div>
                                <label htmlFor="assunto" className="block text-gray-700">Assunto</label>
                                <input
                                    type="text"
                                    id="assunto"
                                    name="assunto"
                                    value={formData.assunto}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                    placeholder="Informe o assunto"
                                    required
                                />
                            </div>

                            {/* Campo Nome */}
                            <div>
                                <label htmlFor="nome" className="block text-gray-700">Nome</label>
                                <input
                                    type="text"
                                    id="nome"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                    placeholder="Seu nome completo"
                                    required
                                />
                            </div>

                            {/* Campo Email */}
                            <div>
                                <label htmlFor="email" className="block text-gray-700">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                    placeholder="Seu email"
                                    required
                                />
                            </div>

                            {/* Campo Telefone */}
                            <div>
                                <label htmlFor="telefone" className="block text-gray-700">Telefone ou Celular</label>
                                <input
                                    type="text"
                                    id="telefone"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                    placeholder="(XX) XXXXX-XXXX"
                                    required
                                />
                            </div>

                            {/* Campo Estado */}
                            <div>
                                <label htmlFor="estado" className="block text-gray-700">Estado</label>
                                <input
                                    type="text"
                                    id="estado"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                    placeholder="Ex: Minas Gerais"
                                    required
                                />
                            </div>

                            {/* Campo Cidade */}
                            <div>
                                <label htmlFor="cidade" className="block text-gray-700">Cidade</label>
                                <input
                                    type="text"
                                    id="cidade"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                    placeholder="Sua cidade"
                                    required
                                />
                            </div>

                            {/* Campo Córrego (não obrigatório) */}
                            <div>
                                <label htmlFor="corrego" className="block text-gray-700">Córrego</label>
                                <input
                                    type="text"
                                    id="corrego"
                                    name="corrego"
                                    value={formData.corrego}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                    placeholder="Informe o córrego"
                                />
                            </div>
                        </div>

                        {/* Campo de Mensagem */}
                        <div>
                            <label htmlFor="mensagem" className="block text-gray-700">Mensagem</label>
                            <textarea
                                id="mensagem"
                                name="mensagem"
                                value={formData.mensagem}
                                onChange={handleChange}
                                className="w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-[#359293]"
                                placeholder="Digite sua mensagem"
                                rows={4}
                                required
                            />
                        </div>

                        {/* Botão de envio */}
                        <button
                            type="submit"
                            className="bg-[#EC5B20] text-white px-6 py-2 rounded-md hover:bg-[#d44c19] transition"
                        >
                            Enviar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Form;
// O componente Form renderiza um formulário de contato
// Ele possui campos para assunto, nome, email, telefone, estado, cidade, córrego e mensagem
// Os dados são armazenados no estado formData e atualizados conforme o usuário digita