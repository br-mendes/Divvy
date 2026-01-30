# Script PowerShell para Upload Automático para GitHub
# Execute: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Depois: .\UPLOAD_GITHUB_POWERSHELL.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Upload Automático para GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$REPO_OWNER = "br-mendes"
$REPO_NAME = "Divvy"
$BASE_PATH = "C:\apps\Divvy"
$BRANCH = "integrate/all-prs"
$COMMIT_MESSAGE = "Implementar melhorias das PRs codex/ consolidadas"

# Solicitar token
Write-Host "É necessário um Personal Access Token do GitHub" -ForegroundColor Yellow
Write-Host "Crie em: https://github.com/settings/tokens" -ForegroundColor Yellow
Write-Host "Selecione scope: repo" -ForegroundColor Yellow
Write-Host ""

$TOKEN = Read-Host "Digite seu Personal Access Token (deixe vazio para cancelar): " -AsSecureString

if (-not $TOKEN) {
    $plainToken = ""
} else {
    $plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($TOKEN))
}

if ([string]::IsNullOrEmpty($plainToken)) {
    Write-Host "Operação cancelada." -ForegroundColor Red
    exit
}

# Headers da API
$headers = @{
    "Authorization" = "token $plainToken"
    "Accept" = "application/vnd.github.v3+json"
}

# Obter SHA do último commit (para base)
Write-Host "Obtendo informações da branch $BRANCH..." -ForegroundColor Gray
$url = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH"
try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    $baseSha = $response.commit.sha
    Write-Host "Base SHA: $baseSha" -ForegroundColor Green
} catch {
    Write-Host "Erro ao obter branch: $_" -ForegroundColor Red
    exit
}

# Lista de arquivos para upload
$files = @(
    "next.config.mjs",
    "package.json",
    "hooks/useAuth.tsx",
    "types/database.ts",
    "types/index.ts",
    "lib/getURL.ts",
    "lib/api/groups.ts",
    "lib/email/resend.ts",
    "lib/supabase/index.ts",
    "lib/supabase/server.ts",
    "lib/supabase/env.ts",
    "app/api/_utils/auth.ts",
    "app/api/_utils/supabase.ts",
    "app/api/groups/route.ts",
    "components/common/Button.tsx",
    "components/common/Input.tsx",
    "components/groups/GroupTabs.tsx",
    "components/groups/GroupsListClient.tsx",
    "components/groups/BalancesPanel.tsx",
    "components/groups/MembersPanel.tsx",
    "components/groups/InvitesPanel.tsx",
    "app/groups/page.tsx",
    "MELHORIAS_IMPLEMENTADAS.md"
)

# Criar árvore de arquivos
Write-Host "Criando árvore de arquivos..." -ForegroundColor Gray
$treeItems = @()

foreach ($file in $files) {
    $fullPath = Join-Path $BASE_PATH $file

    if (-not (Test-Path $fullPath)) {
        Write-Host "  AVISO: Arquivo não encontrado: $file" -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $fullPath -Raw -Encoding UTF8
    $base64Content = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))

    $treeItems += @{
        path = $file
        mode = "100644"
        type = "blob"
        content = $base64Content
    }

    Write-Host "  + $file" -ForegroundColor Gray
}

if ($treeItems.Count -eq 0) {
    Write-Host "Nenhum arquivo para upload!" -ForegroundColor Red
    exit
}

# Criar árvore
Write-Host "Criando árvore no GitHub..." -ForegroundColor Gray
$url = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/git/trees"
$body = @{
    base_tree = $baseSha
    tree = $treeItems
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Post -Body $body -ContentType "application/json"
    $treeSha = $response.sha
    Write-Host "Árvore SHA: $treeSha" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar árvore: $_" -ForegroundColor Red
    exit
}

# Criar commit
Write-Host "Criando commit..." -ForegroundColor Gray
$url = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/git/commits"
$body = @{
    message = $COMMIT_MESSAGE
    tree = $treeSha
    parents = @($baseSha)
    author = @{
        name = "br-mendes"
        email = "br-mendes@users.noreply.github.com"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Post -Body $body -ContentType "application/json"
    $commitSha = $response.sha
    Write-Host "Commit SHA: $commitSha" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar commit: $_" -ForegroundColor Red
    exit
}

# Atualizar referência
Write-Host "Atualizando referência da branch $BRANCH..." -ForegroundColor Gray
$url = "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/git/refs/heads/$BRANCH"
$body = @{
    sha = $commitSha
    force = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Headers $Headers -Method Patch -Body $body -ContentType "application/json"
    Write-Host "Referência atualizada!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao atualizar referência: $_" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Upload concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifique em: https://github.com/$REPO_OWNER/$REPO_NAME" -ForegroundColor Cyan
Write-Host ""