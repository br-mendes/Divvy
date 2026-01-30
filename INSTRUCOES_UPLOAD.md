# Instruções para Upload para GitHub

## Opção 1: Via Git CLI (Recomendada)

### 1. Instalar o Git
- Baixar de: https://git-scm.com/download/win
- Instalar com as opções padrão

### 2. Abrir Terminal
- Navegar até a pasta: `C:\apps\Divvy`
- Pressione Shift + clique direito na pasta e selecione "Abrir janela do PowerShell aqui"

### 3. Executar os comandos

```bash
# Inicializar repositório
git init

# Configurar usuário (se necessário)
git config user.name "Seu Nome"
git config user.email "seu@email.com"

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Implementar melhorias das PRs codex/ da integrate/all-prs"

# Adicionar remoto
git remote add origin https://github.com/br-mendes/Divvy.git

# Renomear branch para main
git branch -M main

# Enviar para o GitHub (será pedido usuário e senha/token)
git push -u origin main
```

## Opção 2: Via GitHub Web Interface

### 1. Acessar o repositório
- Ir em: https://github.com/br-mendes/Divvy

### 2. Criar arquivos manualmente
- Clicar em "Add file" → "Create new file"
- Para cada arquivo em C:\apps\Divvy:
  - Nomear o arquivo com o caminho completo (ex: `components/common/Button.tsx`)
  - Colar o conteúdo
  - Clicar em "Commit changes"

### Lista de arquivos para upload:

**Configuração:**
- `next.config.mjs`
- `package.json`

**Hooks:**
- `hooks/useAuth.tsx`

**Tipos:**
- `types/database.ts`
- `types/index.ts`

**Libraries:**
- `lib/getURL.ts`
- `lib/api/groups.ts`
- `lib/email/resend.ts`
- `lib/supabase/index.ts`
- `lib/supabase/server.ts`
- `lib/supabase/env.ts`

**API Utils:**
- `app/api/_utils/auth.ts`
- `app/api/_utils/supabase.ts`

**API Routes:**
- `app/api/groups/route.ts`

**Components Common:**
- `components/common/Button.tsx`
- `components/common/Input.tsx`

**Components Groups:**
- `components/groups/GroupTabs.tsx`
- `components/groups/GroupsListClient.tsx`
- `components/groups/BalancesPanel.tsx`
- `components/groups/MembersPanel.tsx`
- `components/groups/InvitesPanel.tsx`

**Pages:**
- `app/groups/page.tsx`

**Documentação:**
- `MELHORIAS_IMPLEMENTADAS.md`

## Notas Importantes

1. **Personal Access Token**: Se usar Git CLI, você precisará de um Personal Access Token do GitHub com permissões de `repo`.
   - Criar em: https://github.com/settings/tokens
   - Selecione scope: `repo`
   - Use o token como senha quando solicitado

2. **Branch**: Certifique-se de fazer push para a branch `main` (não `master`)

3. **Conflitos**: Se houver conflitos, resolva manualmente antes de fazer push

4. **Review**: Após o upload, revise os arquivos no GitHub antes de criar pull request