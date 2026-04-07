"use client";

import { useParams } from "next/navigation";
import SlideForm from "@/components/admin/hero/SlideForm";

export default function EditSlidePage() {
  const params = useParams();
  const id = Number(params?.id);

  if (!id || id === 0) return null;

  return <SlideForm slideId={id} />;
}
