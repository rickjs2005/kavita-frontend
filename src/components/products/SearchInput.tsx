"use client"; // Indica que este componente será renderizado no cliente (necessário para usar useState e useEffect)

import { useState, useEffect } from "react";

// Propriedades aceitas pelo componente
interface SearchInputProps {
  placeholder?: string;           // Texto que aparece dentro do campo quando está vazio
  onSearch: (term: string) => void; // Função que será chamada com o termo digitado
  delay?: number;                 // Tempo de espera após digitação (para "debounce")
}

// Componente de campo de busca com debounce
export default function SearchInput({
  placeholder = "Buscar...", // valor padrão
  onSearch,
  delay = 300,                // atraso padrão de 300ms
}: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(""); // Estado do valor digitado
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm); // Estado com atraso (debounced)

  // Aplica o debounce: espera 'delay' milissegundos antes de atualizar o termo final
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay);
    return () => clearTimeout(timer); // Cancela o timer se digitar antes de acabar
  }, [searchTerm, delay]);

  // Quando o termo com debounce for atualizado, chama a função de busca
  useEffect(() => {
    onSearch(debouncedTerm.trim()); // remove espaços no início e fim
  }, [debouncedTerm]);

  return (
    <input
      type="text"
      className="w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#359293]"
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o estado conforme digita
    />
  );
}
