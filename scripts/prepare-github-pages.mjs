import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const clientDir = "dist/client";
const domain = "vrumvrum.art.br";
const routes = [
  "/",
  "/auth",
  "/login",
  "/reset-password",
  "/student",
  "/trainer",
  "/owner",
  "/admin",
  "/planos",
];

async function fileExists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

function ensureDomain(html) {
  return html
    .replace(/https?:\/\/[^"'<>\s]+\.lovable\.app/g, `https://${domain}`)
    .replace(/https?:\/\/lovableproject\.com/g, `https://${domain}`)
    .replace(/https?:\/\/[^"'<>\s]+\.lovableproject\.com/g, `https://${domain}`);
}

const { default: handler } = await import("../dist/server/index.mjs");

async function renderRoute(route) {
  const response = await handler.fetch(
    new Request(`https://${domain}${route}`, {
      headers: {
        host: domain,
        "x-forwarded-host": domain,
        "x-forwarded-proto": "https",
      },
    }),
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Falha ao gerar ${route}: HTTP ${response.status}`);
  }

  return ensureDomain(await response.text());
}

await mkdir(clientDir, { recursive: true });

let fallbackHtml = "";
for (const route of routes) {
  const html = await renderRoute(route);
  if (route === "/") fallbackHtml = html;

  const outputDir = route === "/" ? clientDir : join(clientDir, route.slice(1));
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "index.html"), html);
}

await writeFile(join(clientDir, "404.html"), fallbackHtml || (await renderRoute("/")));
await writeFile(join(clientDir, "CNAME"), `${domain}\n`);
await writeFile(join(clientDir, ".nojekyll"), "");

if (!(await fileExists(join(clientDir, "manifest.webmanifest")))) {
  throw new Error("Manifest PWA não encontrado no build.");
}