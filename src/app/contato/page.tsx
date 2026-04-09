import { fetchPublicShopSettings } from "@/server/data/shopSettings";
import HeroAtendimento from "./components/HeroAtendimento";
import AtalhoAjuda from "./components/AtalhoAjuda";
import FormularioContato from "./components/FormularioContato";
import BlocoConfianca from "./components/BlocoConfianca";

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function toWaMe(phone: string) {
  const d = onlyDigits(phone);
  return d ? `https://wa.me/${d.startsWith("55") ? d : `55${d}`}` : "";
}

export default async function AtendimentoPage() {
  const shop = await fetchPublicShopSettings();

  const whatsapp =
    shop?.contact_whatsapp || shop?.footer?.contact_whatsapp || "";
  const email = shop?.contact_email || shop?.footer?.contact_email || "";
  const whatsappUrl =
    shop?.social_whatsapp_url ||
    shop?.footer?.social_whatsapp_url ||
    (whatsapp ? toWaMe(whatsapp) : "");

  return (
    <main className="min-h-screen bg-gray-50">
      <HeroAtendimento whatsappUrl={whatsappUrl || undefined} />
      <AtalhoAjuda />
      <FormularioContato />
      <BlocoConfianca
        whatsapp={whatsapp || undefined}
        email={email || undefined}
        whatsappUrl={whatsappUrl || undefined}
      />
    </main>
  );
}
