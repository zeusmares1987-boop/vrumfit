import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const clientDir = "dist/client";
const domain = "vrumvrum.art.br";

async function fileExists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function findClientEntry() {
  const assetsDir = join(clientDir, "assets");
  const files = await readdir(assetsDir);
  const entry = files.find((file) => /^index-[\w-]+\.js$/.test(file));
  if (!entry) throw new Error("Arquivo inicial do app não encontrado.");
  return `/assets/${entry}`;
}

const clientEntry = await findClientEntry();
const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>VRUMFIT PERSONAL — Plataforma de Personal Trainers</title>
    <meta name="description" content="VRUMFIT PERSONAL: gestão profissional de alunos, treinos, dietas e avaliações para personal trainers." />
    <meta name="theme-color" content="#0a0a0b" />
    <meta property="og:title" content="VRUMFIT PERSONAL" />
    <meta property="og:description" content="Plataforma profissional para personal trainers." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://${domain}" />
    <meta property="og:site_name" content="VrumFit Personal" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="VrumFit" />
    <meta name="mobile-web-app-capable" content="yes" />
    <link rel="canonical" href="https://${domain}" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" />
    <script type="module" src="${clientEntry}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

await mkdir(clientDir, { recursive: true });
await writeFile(join(clientDir, "index.html"), html);
await writeFile(join(clientDir, "404.html"), html);
await writeFile(join(clientDir, "CNAME"), `${domain}\n`);
await writeFile(join(clientDir, ".nojekyll"), "");

if (!(await fileExists(join(clientDir, "manifest.webmanifest")))) {
  throw new Error("Manifest PWA não encontrado no build.");
}