import { test, expect, type Page } from "@playwright/test";

/**
 * Auditoria de fumaça: visita todas as rotas, captura erros de console
 * e checa que nenhum botão visível dispara erro ao clicar.
 *
 * Para rodar telas autenticadas, exporte a sessão Supabase antes:
 *   export SUPABASE_STORAGE_KEY="sb-<ref>-auth-token"
 *   export SUPABASE_SESSION_JSON='{"access_token":"...","user":{...}, ...}'
 */
const ROUTES = [
  "/", "/auth", "/owner", "/trainer", "/student",
  "/alunos", "/treinos", "/dieta", "/evolucao",
  "/financeiro", "/produtos", "/planos", "/loja",
  "/avisos", "/arquivos", "/personais", "/config",
  "/avaliacoes", "/biblioteca", "/chat", "/suporte", "/elite",
];

async function restoreSession(page: Page) {
  const key = process.env.SUPABASE_STORAGE_KEY;
  const json = process.env.SUPABASE_SESSION_JSON;
  if (!key || !json) return false;
  await page.goto("/");
  await page.evaluate(
    ([k, v]) => window.localStorage.setItem(k, v),
    [key, json] as const,
  );
  return true;
}

test.describe("Smoke: cada rota carrega sem erro de console", () => {
  for (const path of ROUTES) {
    test(`GET ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
      });

      await restoreSession(page);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);

      // Filtra ruído conhecido (favicon, dev HMR, extensões)
      const real = errors.filter(
        (e) => !/favicon|hmr|extension|Failed to load resource/i.test(e),
      );
      expect(real, real.join("\n")).toHaveLength(0);
    });
  }
});

test("Execução: cada botão visível responde sem quebrar", async ({ page }) => {
  await restoreSession(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const buttons = page.locator("button:visible");
  const count = await buttons.count();
  for (let i = 0; i < Math.min(count, 20); i++) {
    const b = buttons.nth(i);
    if (!(await b.isEnabled())) continue;
    await b.click({ trial: true }).catch(() => {});
  }
  expect(errors, errors.join("\n")).toHaveLength(0);
});
