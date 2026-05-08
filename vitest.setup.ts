// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup global do React Testing Library.
//
// Por que explícito: em Vitest 4.x + RTL 16.x, o auto-cleanup do RTL
// (que normalmente detecta `afterEach` global e registra cleanup
// automaticamente) deixou de ser confiável. Sem isso, o DOM jsdom
// acumula entre testes do mesmo arquivo:
//
//   - testes de motorista/rota-page reportavam "Found multiple elements
//     with text 'Você está sem internet...'" (DOM do caso anterior
//     ainda presente quando o próximo render rodava)
//   - timeouts em waitFor por causa de seletores ambíguos sobre DOM legado
//
// Importar `cleanup` aqui e registrar `afterEach(cleanup)` é a defesa
// arquitetural: limpa root, unmonta componentes, libera handlers de
// effect e neutraliza side-effects entre testes em qualquer arquivo.
afterEach(() => {
  cleanup();
});
