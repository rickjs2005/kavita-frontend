import "server-only";

export type FaqTopic = {
  title: string;
  description: string;
  content: string[];
  icon: string;
  priority: number;
  active: boolean;
  highlighted: boolean;
};

export type TrustItem = {
  label: string;
  desc: string;
  icon: string;
  color: string;
};

export type SupportConfig = {
  hero_badge: string | null;
  hero_title: string | null;
  hero_highlight: string | null;
  hero_description: string | null;
  hero_cta_primary: string | null;
  hero_cta_secondary: string | null;
  hero_sla: string | null;
  hero_schedule: string | null;
  hero_status: string | null;
  whatsapp_button_label: string | null;
  show_whatsapp_widget: boolean;
  show_chatbot: boolean;
  show_faq: boolean;
  show_form: boolean;
  show_trust: boolean;
  form_title: string | null;
  form_subtitle: string | null;
  form_success_title: string | null;
  form_success_message: string | null;
  faq_title: string | null;
  faq_subtitle: string | null;
  faq_topics: FaqTopic[] | null;
  trust_title: string | null;
  trust_subtitle: string | null;
  trust_items: TrustItem[] | null;
};

export async function fetchSupportConfig(): Promise<SupportConfig | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${base}/api/public/support-config`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.ok === true ? json.data : json;
    if (!data) return null;
    return {
      ...data,
      show_whatsapp_widget: !!data.show_whatsapp_widget,
      show_chatbot: !!data.show_chatbot,
      show_faq: !!data.show_faq,
      show_form: !!data.show_form,
      show_trust: !!data.show_trust,
    };
  } catch {
    return null;
  }
}
