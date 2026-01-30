# Deploy do Divvy

## Fluxo de Deploy

```
integrate/all-prs ──────► Deploy automático (Vercel)
       │
       │ (quando pronto)
       │
       └─────► merge na main (aprovada)
```

## Branches

### integrate/all-prs (ATIVA PARA DEPLOY)
- **Uso**: Desenvolvimento consolidado
- **Deploy automático**: ✅ SIM (via Vercel)
- **Acessível em**: https://divvyapp.online
- **Contém**: Todas as melhorias das PRs codex/ implementadas

### main (ESTÁVEL)
- **Uso**: Produção estável após merge
- **Deploy automático**: Sim (após merge)
- **Acessível em**: https://divvyapp.online (mesma URL)

## Processo de Upload

1. **Fazer commit dos arquivos** para `integrate/all-prs`
2. **Push para GitHub** → Deploy automático via Vercel
3. **Testar no site**: https://divvyapp.online
4. **Se OK**: Criar PR `integrate/all-prs` → `main`
5. **Aprovar e merge** → Deployment em produção

## Scripts Disponíveis

### 🚀 PowerShell Automático
```powershell
.\UPLOAD_GITHUB_POWERSHELL.ps1
```
- Faz upload direto para `integrate/all-prs`
- Necessita Personal Access Token

### 🔧 Git CLI Manual
```bash
git init
git add .
git commit -m "Implementar melhorias"
git remote add origin https://github.com/br-mendes/Divvy.git
git checkout -b integrate/all-prs
git push -u origin integrate/all-prs
```

### 📁 Interface Web
1. Acessar: https://github.com/br-mendes/Divvy
2. Ir para branch: `integrate/all-prs`
3. Upload dos 24 arquivos manualmente

## Checklist de Deploy

- [ ] Arquivos implementados (24)
- [ ] Push para `integrate/all-prs`
- [ ] Build Vercel: ✅ Sucesso
- [ ] Deploy Vercel: ✅ Sucesso
- [ ] Teste manual no site
- [ ] Merge em `main` (se OK)

## Links Úteis

- **GitHub**: https://github.com/br-mendes/Divvy
- **Deploy**: https://divvyapp.online
- **Vercel Dashboard**: https://vercel.com/brunos-projects-149e8d0e/divvy
- **Branches**: https://github.com/br-mendes/Divvy/branches

## Nota Importante

A branch `integrate/all-prs` **NÃO** deve ser deletada. Ela serve como base para futuras implementações e deploy automático.