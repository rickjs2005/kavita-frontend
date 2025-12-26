import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PostForm from "@/components/admin/kavita-news/posts/PostForm";
import type { NewsPostUpsertInput } from "@/types/kavita-news";

/* =======================
   Mocks globais seguros
======================= */
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

/* =======================
   Helper de render
======================= */
function renderPostForm() {
  const onClose = vi.fn();

  // 🔴 PONTO CRÍTICO
  // Tipagem correta do mock → elimina TODOS os erros de TS
  const onSubmit = vi.fn<
    (payload: NewsPostUpsertInput) => Promise<void>
  >(async () => undefined);

  render(
    <PostForm
      open
      mode="create"
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );

  return { onClose, onSubmit };
}

/* =======================
   Testes
======================= */
describe("PostForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submit Publicar agora: força status=published e publish_now=true (positivo)", async () => {
    const { onSubmit } = renderPostForm();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText("Ex: Café sobe com clima seco"),
      "Post publicar"
    );

    await user.type(
      screen.getByPlaceholderText("Conteúdo do post..."),
      "Conteúdo"
    );

    await user.click(
      screen.getByRole("button", { name: "Publicar agora" })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    // ✅ SEM CAST
    // ✅ SEM TUPLE
    // ✅ SEM ERRO TS
    const payload = onSubmit.mock.calls[0][0];

    expect(payload.status).toBe("published");
    expect(payload.publish_now).toBe(true);
    expect(payload.title).toBe("Post publicar");
    expect(payload.slug).toBe("post-publicar");
  });
});
