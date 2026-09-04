#!/bin/bash
# ============================================================
# HANGAR · Iniciar (macOS) — dê dois cliques neste arquivo.
# Na PRIMEIRA vez o macOS pode bloquear:
#  1) Tente: botão direito → Abrir → Abrir (macOS 14 ou anterior)
#  2) Se só aparecer "OK" (macOS 15+): Ajustes do Sistema →
#     Privacidade e Segurança → seção Segurança → "Abrir Assim
#     Mesmo", e dê dois cliques de novo.
# Das próximas vezes, é só dois cliques.
# ============================================================
cd "$(dirname "$0")"

echo ""
echo "  ██╗  HANGAR · Sala de Controle · Clube da IA"
echo ""

# 1) Node instalado?
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ O Node.js não está instalado nesta máquina."
  echo "   Baixe a versão LTS em: https://nodejs.org"
  echo "   Instale e rode este arquivo de novo."
  echo ""
  read -r -p "Pressione Enter para fechar... "
  exit 1
fi

# 2) Primeira vez? Instala as peças do app.
if [ ! -d node_modules ]; then
  echo "📦 Primeira vez nesta máquina: baixando as peças do app (~200 MB)."
  echo "   Pode levar alguns minutos — não feche esta janela."
  echo ""
  npm install || {
    echo ""
    echo "❌ A instalação falhou. Confira sua internet e rode de novo."
    read -r -p "Pressione Enter para fechar... "
    exit 1
  }
fi

# 3) Sobe o HANGAR (o navegador abre sozinho).
echo ""
echo "🚀 Subindo o HANGAR... o navegador vai abrir sozinho."
echo "   DEIXE ESTA JANELA ABERTA enquanto usa o app."
echo "   Para desligar: feche esta janela (ou Ctrl+C)."
echo ""
npm run dev
