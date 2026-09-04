@echo off
rem ============================================================
rem HANGAR - Iniciar (Windows) - de dois cliques neste arquivo.
rem Se o Windows avisar "protegeu seu PC": clique em
rem "Mais informacoes" e depois "Executar assim mesmo".
rem ============================================================
cd /d "%~dp0"

echo.
echo   HANGAR - Sala de Controle - Clube da IA
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [X] O Node.js nao esta instalado nesta maquina.
  echo     Baixe a versao LTS em: https://nodejs.org
  echo     Instale e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [*] Primeira vez nesta maquina: baixando as pecas do app (~200 MB^).
  echo     Pode levar alguns minutos - nao feche esta janela.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [X] A instalacao falhou. Confira sua internet e rode de novo.
    pause
    exit /b 1
  )
)

echo.
echo [^>] Subindo o HANGAR... o navegador vai abrir sozinho.
echo     DEIXE ESTA JANELA ABERTA enquanto usa o app.
echo     Para desligar: feche esta janela (ou Ctrl+C^).
echo.
call npm run dev
pause
