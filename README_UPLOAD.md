# Upload para GitHub (Branch integrate/all-prs)

## Como fazer upload dos arquivos para a branch integrate/all-prs

**IMPORTANTE**: O deploy é feito a partir da branch `integrate/all-prs`, então todos os commits devem ser enviados para ela, não para `main`.

### Opção 1: Script PowerShell Automático (Mais Fácil)

1. **Execute o script PowerShell:**
   ```powershell
   .\UPLOAD_GITHUB_POWERSHELL.ps1
   ```

2. **Será pedido seu Personal Access Token:**
   - Crie em: https://github.com/settings/tokens
   - Selecione scope: `repo`
   - Cole o token quando solicitado

3. **O script fará automaticamente:**
   - Upload de todos os arquivos implementados
   - Criação de commit com mensagem descritiva
   - Push para a branch `main`

### Opção 2: Via Git CLI (Tradicional)

1. **Instale o Git** (se ainda não tiver):
   - Download: https://git-scm.com/download/win

2. **Navegue até a pasta:**
   ```bash
   cd C:\apps\Divvy
   ```

3. **Execute os comandos:**
   ```bash
   git init
   git config user.name "Seu Nome"
   git config user.email "seu@email.com"
   git add .
   git commit -m "Implementar melhorias das PRs codex/ da integrate/all-prs"
   git remote add origin https://github.com/br-mendes/Divvy.git
git checkout -b integrate/all-prs
git push -u origin integrate/all-prs
   ```

### Opção 3: Interface Web do GitHub (Manual)

1. Acesse: https://github.com/br-mendes/Divvy

2. Para cada arquivo listado abaixo:
   - Clique em "Add file" → "Create new file"
   - Digite o caminho completo do arquivo (ex: `components/common/Button.tsx`)
   - Cole o conteúdo do arquivo
   - Clique em "Commit changes"

## Arquivos Implementados

**Configuração (2 arquivos):**
- `next.config.mjs` - Suporte GitHub Pages e Vercel
- `package.json` - Dependências atualizadas

**Hooks (1 arquivo):**
- `hooks/useAuth.tsx` - Autenticação com Google OAuth e upsertUserProfile

**Tipos (2 arquivos):**
- `types/database.ts` - Tipagem Supabase Database
- `types/index.ts` - Export de tipos

**Libraries (7 arquivos):**
- `lib/getURL.ts` - Helper para URL base
- `lib/api/groups.ts` - Client API de grupos
- `lib/email/resend.ts` - Resend com pickFirst helper
- `lib/supabase/index.ts` - Cliente Supabase
- `lib/supabase/server.ts` - Cliente Supabase server
- `lib/supabase/env.ts` - Verificação de env

**API Utils (2 arquivos):**
- `app/api/_utils/auth.ts` - Helpers de autenticação
- `app/api/_utils/supabase.ts` - Helpers avançados Supabase

**API Routes (1 arquivo):**
- `app/api/groups/route.ts` - GET/POST groups com schema tolerance

**Components Common (2 arquivos):**
- `components/common/Button.tsx` - Button com forwardRef, variantes, tamanhos
- `components/common/Input.tsx` - Input com forwardRef, erros, toggle senha

**Components Groups (5 arquivos):**
- `components/groups/GroupTabs.tsx` - Tabs de navegação
- `components/groups/GroupsListClient.tsx` - Listagem de grupos
- `components/groups/BalancesPanel.tsx` - Painel de saldos
- `components/groups/MembersPanel.tsx` - Painel de membros
- `components/groups/InvitesPanel.tsx` - Painel de convites

**Pages (1 arquivo):**
- `app/groups/page.tsx` - Página de listagem de grupos

**Documentação (1 arquivo):**
- `MELHORIAS_IMPLEMENTADAS.md` - Detalhes de todas as melhorias

## Total

**24 arquivos implementados** com todas as melhorias das PRs codex/ da branch `integrate/all-prs`.

## Próximos Passos

Após o upload para `integrate/all-prs`:

1. **Revise os arquivos** no GitHub na branch integrate/all-prs
2. **O deploy Vercel é automático** a partir da branch integrate/all-prs
3. **Para merge na main**: Crie uma Pull Request de integrate/all-prs → main
4. **Teste as funcionalidades** no site: https://divvyapp.online

## Suporte

Em caso de problemas, consulte:
- Documentação em `MELHORIAS_IMPLEMENTADAS.md`
- Instruções em `INSTRUCOES_UPLOAD.md`
- Fluxo de deploy em `DEPLOY.md`
- Execute `.\UPLOAD_GITHUB.bat` para instruções rápidas