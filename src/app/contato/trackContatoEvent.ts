import apiClient from "@/lib/apiClient";

type ContatoEvent = "faq_topic_view" | "faq_search" | "form_start" | "whatsapp_hero_click";

/**
 * Fire-and-forget analytics event for the contato page.
 * Never throws — failures are silently ignored.
 */
export function trackContatoEvent(event: ContatoEvent, value?: string) {
  apiClient.post("/api/public/contato/event", { event, value }).catch(() => {});
}
