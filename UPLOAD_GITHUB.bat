@echo off
echo ========================================
echo  Upload dos arquivos para GitHub
echo Branch: integrate/all-prs (deploy via Vercel)
echo ========================================
echo.
echo Como nao temos git instalado, voce precisara:
echo.
echo 1. Instalar o Git: https://git-scm.com/download/win
echo 2. Abrir o terminal na pasta C:\apps\Divvy
echo 3. Executar os comandos abaixo:
echo.
echo    git init
echo    git config user.name "Seu Nome"
echo    git config user.email "seu@email.com"
echo    git add .
echo    git commit -m "Implementar melhorias das PRs codex/"
echo    git remote add origin https://github.com/br-mendes/Divvy.git
echo    git checkout -b integrate/all-prs
echo    git push -u origin integrate/all-prs
echo.
echo IMPORTANTE: O deploy Vercel e' feito a partir da branch integrate/all-prs
echo.
echo ========================================
pause