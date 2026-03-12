// src/hooks/useUpload.ts
export function useUpload() {
  const upload = async (file: File, type: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);

    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    return data.path; // "uploads/produtos/123-abc.jpg"
  };

  return { upload };
}

// src/components/ProductForm.tsx
const { upload } = useUpload();

const handleUpload = async (file: File) => {
  const imagePath = await upload(file, "produtos"); // Salva no backend
  
  // Agora salva o caminho no banco (via API)
  await saveProduct({
    name: "Produto X",
    image: imagePath, // "uploads/produtos/123-abc.jpg"
  });
};

function saveProduct(arg0: { name: string; image: any; }) {
    throw new Error("Function not implemented.");
}
