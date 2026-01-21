import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

function fail(msg) {
  console.error(`\n VERIFY FAIL: ${msg}\n`);
  process.exit(1);
}

function ok(msg) {
  console.log(` ${msg}`);
}

// 1) Arquivos críticos (inclui HOME e páginas-chave)
const requiredFiles = [
  // Home (App Router)
  "app/page.tsx",

  // Grupo
  "app/groups/[divvyId]/page.tsx",
  "components/groups/GroupTabs.tsx",

  // Painéis principais
  "components/groups/ExpensesPanel.tsx",
  "components/groups/BalancesPanel.tsx",
  "components/groups/PaymentsPanel.tsx",
  "components/groups/PeriodPicker.tsx",
  "components/groups/CategoriesPanel.tsx",

  // Features já feitas
  "components/groups/ExpenseAttachments.tsx",
];

// APIs críticas que já usamos
const requiredApiRoutes = [
  "app/api/groups/[divvyId]/balances/route.ts",
  "app/api/groups/[divvyId]/expenses/route.ts",
  "app/api/groups/[divvyId]/payments/route.ts",

  // categorias/anexos/csv
  "app/api/groups/[divvyId]/categories/route.ts",
  "app/api/groups/[divvyId]/categories/[categoryId]/route.ts",
  "app/api/groups/[divvyId]/expenses/export.csv/route.ts",
  "app/api/groups/[divvyId]/expenses/[expenseId]/attachments/route.ts",
  "app/api/groups/[divvyId]/expenses/[expenseId]/attachments/[attachmentId]/route.ts",
  "app/api/groups/[divvyId]/expenses/[expenseId]/attachments/[attachmentId]/download/route.ts",

  // períodos (se já aplicou fase de períodos/lock)
  "app/api/groups/[divvyId]/periods/route.ts",
  "app/api/groups/[divvyId]/periods/close/route.ts",
  "app/api/groups/[divvyId]/periods/[periodId]/reopen/route.ts",
];

for (const f of requiredFiles) {
  if (!exists(f)) fail(`Arquivo essencial ausente: ${f}`);
}
ok("Arquivos essenciais OK");

for (const f of requiredApiRoutes) {
  if (!exists(f)) fail(`API route essencial ausente: ${f}`);
}
ok("API routes essenciais OK");

// 2) Guardrail: não permitir .env.production versionado
const gitEnvProd = [
  ".env.production",
  ".env.production.local",
  ".env.production.*",
].filter((p) => exists(p));
if (gitEnvProd.length) {
  console.warn(" Aviso: arquivos .env.production* encontrados no repo:");
  gitEnvProd.forEach((p) => console.warn("   -", p));
  console.warn("   Recomendação: remover do git e usar apenas Vercel env vars.");
}

// 3) Env vars mínimas (não imprime valores)
const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  // server-side
  // "SUPABASE_SERVICE_ROLE_KEY", // descomente quando usar admin global
  // "RESEND_API_KEY",            // descomente quando usar e-mails
  "NEXT_PUBLIC_APP_URL",
];

const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  fail(
    `Env vars ausentes: ${missing.join(", ")} (configure no Vercel/ambiente local)`
  );
}
ok("Env vars mínimas presentes");

// 4) Proteção extra: HOME export default (evita home quebrar)
const homePath = path.join(ROOT, "app/page.tsx");
const home = fs.readFileSync(homePath, "utf8");
if (!home.includes("export default")) {
  fail("app/page.tsx não contém `export default` (home pode quebrar)");
}
ok("Home export default OK");

console.log("\n VERIFY OK: estrutura essencial e env estão consistentes.\n");
