"use client"; // Isso diz pro Next.js que essa parte funciona no navegador (no computador do usuário)

import { useEffect, useState } from "react";
import CustomButton from "@/components/buttons/CustomButton"; // Botão personalizado
import { Product } from "@/types/product"; // Tipo que define o que um produto tem

// Propriedades que esse formulário precisa receber
interface ProdutoFormProps {
  onProdutoAdicionado: () => void; // Função para recarregar os produtos após salvar
  produtoEditado?: Product | null; // Produto que estamos editando (ou nulo se for novo)
  onLimparEdicao?: () => void; // Função para cancelar a edição
}

// O componente do formulário em si
export default function ProdutoForm({
  onProdutoAdicionado,
  produtoEditado,
  onLimparEdicao,
}: ProdutoFormProps) {
  // Aqui ficam os dados que estamos digitando
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    quantity: "",
    category_id: "",
  });

  // Lista de categorias para escolher
  const [categorias, setCategorias] = useState<{ id: number; name: string }[]>([]);

  // Controle de carregamento e erro
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Quando a tela carrega, buscamos as categorias
  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    fetch("http://localhost:5000/api/admin/categorias", {
      headers: {
        Authorization: `Bearer ${token}`, // Envia o crachá do admin
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar categorias");
        return res.json(); // Transformamos a resposta em dados
      })
      .then(setCategorias) // Guardamos as categorias
      .catch(() => setCategorias([])); // Se der erro, deixamos vazio
  }, []);

  // Se estivermos editando um produto, preenche o formulário com os dados dele
  useEffect(() => {
    if (produtoEditado) {
      setForm({
        name: produtoEditado.name || "",
        description: produtoEditado.description || "",
        price: String(produtoEditado.price || ""),
        image: produtoEditado.image || "",
        quantity: String(produtoEditado.quantity || ""),
        category_id: String(produtoEditado.category_id || ""),
      });
    }
  }, [produtoEditado]);

  // Quando digitamos em qualquer campo, atualizamos o valor dele
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Função para enviar o formulário (salvar o produto)
  const handleSubmit = async () => {
    setIsLoading(true); // Mostra que está carregando
    setErro(""); // Limpa mensagens de erro

    const token = localStorage.getItem("adminToken");

    // Se for edição, usamos PUT. Se for novo, usamos POST.
    const url = produtoEditado
      ? `http://localhost:5000/api/admin/produtos/${produtoEditado.id}`
      : "http://localhost:5000/api/admin/produtos";

    const method = produtoEditado ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Enviamos os dados do formulário para o servidor
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price), // transforma texto em número
          quantity: parseInt(form.quantity), // transforma texto em número inteiro
          category_id: parseInt(form.category_id),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao salvar produto.");
      }

      // Se deu tudo certo, limpamos o formulário e recarregamos a lista de produtos
      onProdutoAdicionado();

      setForm({
        name: "",
        description: "",
        price: "",
        image: "",
        quantity: "",
        category_id: "",
      });

      onLimparEdicao?.(); // Cancela a edição se estiver editando
    } catch (err: any) {
      setErro(err.message); // Mostra o erro para o usuário
    }

    setIsLoading(false); // Paramos o carregamento
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6 max-w-xl">
      {/* Título: se for edição, mostra "Editar", senão "Novo" */}
      <h2 className="text-lg font-semibold mb-4">
        {produtoEditado ? "Editar Produto" : "Novo Produto"}
      </h2>

      {/* Campos do formulário */}
      <input
        name="name"
        placeholder="Nome"
        value={form.name}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded"
      />

      <textarea
        name="description"
        placeholder="Descrição"
        value={form.description}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded"
      />

      <input
        name="image"
        placeholder="URL da imagem"
        value={form.image}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded"
      />

      <input
        name="price"
        type="number"
        placeholder="Preço"
        value={form.price}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded"
      />

      <input
        name="quantity"
        type="number"
        placeholder="Quantidade"
        value={form.quantity}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded"
      />

      {/* Seleção de categoria */}
      <select
        name="category_id"
        value={form.category_id}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
      >
        <option value="">Selecione uma categoria</option>
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.name}
          </option>
        ))}
      </select>

      {/* Botão final de salvar */}
      <CustomButton
        label={produtoEditado ? "Salvar Alterações" : "Adicionar Produto"}
        onClick={handleSubmit}
        variant="primary"
        size="large"
        isLoading={isLoading}
        message={erro}
      />
    </div>
  );
}
// Explicação do código:
// - O formulário permite adicionar ou editar produtos.