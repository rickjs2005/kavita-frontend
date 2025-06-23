"use client"; // Isso aqui avisa que o código vai funcionar no navegador, igual um site normal

import { useEffect, useState } from "react"; // usamos para guardar informações e fazer coisas quando a página abrir
import axios from "axios"; // biblioteca que ajuda a conversar com o servidor
import DeleteButton from "@/components/buttons/DeleteButton"; // botão que serve para remover algo

// Aqui dizemos como é um produto simples
interface Product {
    id: number;
    name: string;
}

// Aqui dizemos como é um produto que está em destaque (tipo um produto especial que aparece na frente)
interface Destaque {
    id: number;
    product_id: number;
    name: string;
    image: string;
    price: number;
}

export default function DestaquesPage() {
    // Aqui a gente guarda todos os produtos disponíveis
    const [produtos, setProdutos] = useState<Product[]>([]);

    // Aqui guardamos os produtos que já estão em destaque
    const [destaques, setDestaques] = useState<Destaque[]>([]);

    // Aqui a gente guarda qual produto foi escolhido no menu de seleção
    const [produtoSelecionado, setProdutoSelecionado] = useState("");

    // Quando a página carrega, a gente já busca os produtos e os destaques
    useEffect(() => {
        buscarProdutos();
        buscarDestaques();
    }, []);

    // Essa função vai até o servidor pegar todos os produtos
    const buscarProdutos = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/products?category=all");
            setProdutos(res.data as Product[]); // colocamos os produtos na nossa caixinha
        } catch (error) {
            console.error("Erro ao buscar produtos", error);
        }
    };

    // Essa aqui pega os produtos que estão em destaque
    const buscarDestaques = async () => {
        const token = localStorage.getItem("adminToken"); // pegamos o crachá do admin
        try {
            const res = await axios.get("http://localhost:5000/api/admin/destaques", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // transformamos o preço em número para ficar certinho
            setDestaques(
                (res.data as any[]).map((item: any) => ({
                    ...item,
                    price: Number(item.price),
                }))
            );
        } catch (error) {
            console.error("Erro ao buscar destaques", error);
        }
    };

    // Essa função adiciona o produto escolhido para virar destaque
    const adicionarDestaque = async () => {
        const token = localStorage.getItem("adminToken"); // pegamos o crachá de novo
        if (!produtoSelecionado) return; // se ninguém escolheu nada, não faz nada

        try {
            await axios.post(
                "http://localhost:5000/api/admin/destaques",
                { product_id: produtoSelecionado },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setProdutoSelecionado(""); // limpamos a seleção
            buscarDestaques(); // atualizamos a lista
        } catch (error) {
            console.error("Erro ao adicionar destaque", error);
        }
    };

    // Essa função remove um produto da lista de destaques
    const removerDestaque = async (id: number) => {
        const token = localStorage.getItem("adminToken");
        try {
            await axios.delete(`http://localhost:5000/api/admin/destaques/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            buscarDestaques(); // atualiza a lista depois de remover
        } catch (error) {
            console.error("Erro ao remover destaque", error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[#359293] mb-4">Gerenciar Destaques</h1>

            {/* Aqui é onde escolhemos qual produto vai virar destaque */}
            <div className="flex gap-4 items-center mb-6">
                <select
                    value={produtoSelecionado}
                    onChange={(e) => setProdutoSelecionado(e.target.value)} // quando muda, guarda o valor
                    className="px-4 py-2 border rounded w-64"
                >
                    <option value="">Selecione um produto</option>
                    {/* Aqui mostramos todos os produtos para escolher */}
                    {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>
                            {produto.name}
                        </option>
                    ))}
                </select>

                {/* Botão verdinho para adicionar o produto como destaque */}
                <button
                    onClick={adicionarDestaque}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                    Adicionar
                </button>
            </div>

            {/* Aqui mostramos todos os produtos que estão em destaque atualmente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {destaques.map((item) => (
                    <div key={item.id} className="bg-white shadow-md rounded-lg p-4">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="h-32 w-full object-cover rounded mb-2"
                        />
                        <h2 className="font-semibold">{item.name}</h2>
                        <p className="text-gray-500">
                            {/* Mostra o preço se for número, se não mostra "indisponível" */}
                            {typeof item.price === "number"
                                ? `R$ ${item.price.toFixed(2)}`
                                : "Preço indisponível"}
                        </p>
                        {/* Botão para remover o destaque */}
                        <div className="mt-2">
                            <DeleteButton onConfirm={() => removerDestaque(item.id)} label="Remover" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
