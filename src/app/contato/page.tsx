import { fetchPublicShopSettings } from "@/server/data/shopSettings";
import { fetchSupportConfig } from "@/server/data/supportConfig";
import type { SupportConfig } from "@/server/data/supportConfig";
import HeroAtendimento from "./components/HeroAtendimento";
import AtalhoAjuda from "./components/AtalhoAjuda";
import FormularioContato from "./components/FormularioContato";
import BlocoConfianca from "./components/BlocoConfianca";
import { onlyDigits } from "@/utils/formatters";

function toWaMe(phone: string) {
  const d = onlyDigits(phone);
  return d ? `https://wa.me/${d.startsWith("55") ? d : `55${d}`}` : "";
}

type Metrics = {
  total_mensagens: number;
  taxa_resposta: number;
  tempo_medio: string | null;
} | null;

async function fetchMetrics(): Promise<Metrics> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${base}/api/public/contato/metrics`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.ok === true ? json.data : json;
    return data || null;
  } catch {
    return null;
  }
}

export default async function AtendimentoPage() {
  const [shop, metrics, supportConfig] = await Promise.all([
    fetchPublicShopSettings(),
    fetchMetrics(),
    fetchSupportConfig(),
  ]);

  const cfg = supportConfig as SupportConfig | null;

  const whatsapp =
    shop?.contact_whatsapp || shop?.footer?.contact_whatsapp || "";
  const email = shop?.contact_email || shop?.footer?.contact_email || "";
  const whatsappUrl =
    shop?.social_whatsapp_url ||
    shop?.footer?.social_whatsapp_url ||
    (whatsapp ? toWaMe(whatsapp) : "");

  return (
    <main className="min-h-screen bg-gray-50">
      <HeroAtendimento whatsappUrl={whatsappUrl || undefined} config={cfg} />
      {cfg?.show_faq !== false && <AtalhoAjuda config={cfg} />}
      {cfg?.show_form !== false && <FormularioContato config={cfg} />}
      {cfg?.show_trust !== false && (
        <BlocoConfianca
          whatsapp={whatsapp || undefined}
          email={email || undefined}
          whatsappUrl={whatsappUrl || undefined}
          metrics={metrics}
          config={cfg}
        />
      )}
    </main>
  );
}
