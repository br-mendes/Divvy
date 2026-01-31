# Upload Script Final

# Adicionar ao Git
git add .

# Fazer commit
git commit -m "Consolidate: implementar melhorias das PRs codex/ (next.config, utilities, groups UI)"

# Push para GitHub
git push -u origin integrate/all-prs

Write-Host "Execute manualmente no seu terminal PowerShell:"
Write-Host "cd C:\apps\Divvy"
Write-Host "git add ."
Write-Host "git commit -m \"Consolidate: implementar melhorias das PRs codex/ (next.config, utilities, groups UI)\""
Write-Host "git push -u origin integrate/all-prs"
Write-Host ""
Write-Host "Após o push, verifique o deploy em: https://vercel.com/brunos-projects-149e8d0e92f8c33/divvy"