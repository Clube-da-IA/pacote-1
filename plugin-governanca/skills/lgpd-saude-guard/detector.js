#!/usr/bin/env node

/**
 * lgpd-saude-guard — Detector de conformidade LGPD/CFM 2.454
 * 
 * Uso: node detector.js [caminho-pasta]
 * Exemplo: node detector.js ./src
 * 
 * Saída:
 *   1. _lgpd-security-audit.md (arquivo detalhado)
 *   2. Console (resumo inline)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────────

const IGNORE_PATHS = [
  'node_modules',
  '.git',
  '.env.local',
  '.env.*.local',
  'dist',
  'build',
  '.next',
  '.cache',
  '__pycache__',
  '.DS_Store',
  '_lgpd-security-audit.md', // Próprio relatório — evita auto-escaneamento
];

const PROD_PATHS = [
  'src',
  'api',
  'backend',
  'lambda',
  'server',
  'lib',
];

const DEV_PATHS = [
  'tests',
  'test',
  '__tests__',
  '.github',
  'docs',
  'doc',
  'examples',
  'example',
  '.md',
];

// ─────────────────────────────────────────────────────────────────
// PADRÕES DE DETECÇÃO
// ─────────────────────────────────────────────────────────────────

const PATTERNS = {
  CRÍTICO: [
    {
      id: 'cpf-real',
      name: 'CPF ou CNPJ real',
      regex: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b|\b\d{14}\b/g,
      norma: 'LGPD Art. 9º (dado sensível de identificação)',
      recomendacao: 'Mover para .env ou usar dado fictício',
      severidade: 'crítico',
    },
    {
      id: 'laudo-identifica',
      // Exige: (a) termo clínico + (b) nome próprio (2 palavras capitalizadas) OU CPF na MESMA frase.
      // Evita falso positivo de comentário que só menciona a palavra "nome".
      name: 'Laudo clínico com identificação de paciente',
      regex: /(Paciente|Diagnóstico|Anamnese|Prontuário)\s+([A-ZÀ-Ú][a-zà-ú]+\s+[A-ZÀ-Ú][a-zà-ú]+|.{0,60}?\d{3}\.?\d{3}\.?\d{3}-?\d{2})/g,
      norma: 'LGPD Art. 9º + Lei 12.842/2013 (sigilo médico) + CFM 2.454 Art. 2-4 (responsabilidade)',
      recomendacao: 'Validar assinatura médica + consentimento; usar fictício se teste',
      severidade: 'crítico',
    },
  ],
  AVISO: [
    {
      id: 'credencial-banco',
      name: 'Credencial de banco/API em código',
      regex: /(DATABASE_URL|API_KEY|SECRET_KEY|PASSWORD|PRIVATE_KEY|AUTH_TOKEN)[\s]*[=:][\s]*["']?[a-z0-9\-_.@:/]{8,}["']?/gi,
      norma: 'LGPD Art. 32 (segurança técnica)',
      recomendacao: 'Mover para .env ou AWS Secrets Manager; usar .gitignore',
      severidade: 'aviso',
    },
    {
      id: 'url-producao',
      name: 'URL de servidor de produção em código',
      regex: /https?:\/\/(api-prod|api-live|prod\.api|production|live)[a-z0-9\-._]*\.com/gi,
      norma: 'LGPD Art. 32 (infraestrutura segura)',
      recomendacao: 'Usar variável de ambiente (process.env.API_URL)',
      severidade: 'aviso',
    },
  ],
  OK: [
    {
      id: 'dado-ficticao',
      name: 'Dado fictício/teste (naturalizado)',
      regex: /(fictício|fictional|test|exemplo|example|mock|dummy|paciente teste|user@example\.com|test@.*\.com)/gi,
      norma: 'LGPD Art. 5º (finalidade clara)',
      recomendacao: 'OK — claramente não é real',
      severidade: 'ok',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// FUNÇÕES UTILITÁRIAS
// ─────────────────────────────────────────────────────────────────

function isIgnoredPath(filepath) {
  return IGNORE_PATHS.some(ignored => filepath.includes(ignored));
}

function isProdContext(filepath) {
  const normalizedPath = filepath.toLowerCase();
  return PROD_PATHS.some(prod => normalizedPath.includes(`/${prod}/`) || normalizedPath.startsWith(`${prod}/`));
}

function isDevContext(filepath) {
  const normalizedPath = filepath.toLowerCase();
  return DEV_PATHS.some(dev => 
    normalizedPath.includes(`/${dev}/`) || 
    normalizedPath.startsWith(`${dev}/`) ||
    normalizedPath.endsWith('.md') ||
    normalizedPath.includes('.github')
  );
}

function getContextClass(filepath) {
  if (isDevContext(filepath)) return 'dev';
  if (isProdContext(filepath)) return 'prod';
  return 'unknown';
}

function shouldScanFile(filepath) {
  if (isIgnoredPath(filepath)) return false;
  const ext = path.extname(filepath).toLowerCase();
  const scanableExts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java', '.cs', '.rb', '.php', '.sql', '.json', '.yaml', '.yml', '.env', '.sh', '.md'];
  return scanableExts.includes(ext) || !ext; // Sem extensão também escaneia
}

function readFileSeguro(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch (e) {
    return null;
  }
}

function getLineContent(content, lineNum) {
  const lines = content.split('\n');
  return lines[lineNum - 1] || '';
}

function hashAchado(filepath, lineNum, padraoId) {
  return crypto
    .createHash('md5')
    .update(`${filepath}:${lineNum}:${padraoId}`)
    .digest('hex')
    .slice(0, 8);
}

// Sequências de teste conhecidas — NÃO são CPF real, naturalizar.
const CPF_TESTE_CONHECIDOS = new Set([
  '12345678901', '11111111111', '00000000000', '99999999999',
  '12345678900', '00000000001',
]);

/**
 * Valida se uma string de 11 dígitos é um CPF real (dígito verificador correto).
 * Números de teste (sequências, dígitos repetidos) retornam false → naturalizados.
 */
function isCPFReal(str) {
  const cpf = str.replace(/[.\-]/g, '');
  if (cpf.length !== 11) return false;
  if (CPF_TESTE_CONHECIDOS.has(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Todos dígitos iguais

  // Cálculo do dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let d1 = 11 - (soma % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  let d2 = 11 - (soma % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
}

// ─────────────────────────────────────────────────────────────────
// SCANNING
// ─────────────────────────────────────────────────────────────────

function scanFile(filepath) {
  const achados = [];
  const content = readFileSeguro(filepath);
  
  if (!content) return achados;

  const contexto = getContextClass(filepath);
  const lines = content.split('\n');

  // Escanear todos os padrões
  for (const [severidade, padroes] of Object.entries(PATTERNS)) {
    for (const pattern of padroes) {
      let match;
      pattern.regex.lastIndex = 0; // Reset regex state

      while ((match = pattern.regex.exec(content)) !== null) {
        // Filtro específico do CPF: só marca se for CPF real (dígito verificador válido).
        // Números de teste/sequência são ignorados aqui (naturalizados).
        if (pattern.id === 'cpf-real') {
          const soDigitos = match[0].replace(/[.\-]/g, '');
          // CNPJ (14 díg) segue marcando; CPF (11 díg) só se real.
          if (soDigitos.length === 11 && !isCPFReal(match[0])) {
            continue;
          }
        }

        const posicao = content.substring(0, match.index).split('\n').length;
        const lineContent = getLineContent(content, posicao).trim();

        achados.push({
          id: hashAchado(filepath, posicao, pattern.id),
          arquivo: filepath,
          linha: posicao,
          conteudoLinha: lineContent.substring(0, 100), // Primeiros 100 chars, sem valores
          padrao: pattern.name,
          padraoId: pattern.id,
          match: match[0].substring(0, 50), // Amostra do match (sem expor valores)
          norma: pattern.norma,
          recomendacao: pattern.recomendacao,
          severidade: pattern.severidade,
          contexto,
        });
      }
    }
  }

  return achados;
}

function scanFolder(folderPath) {
  const achados = [];
  let filesScanned = 0;

  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const relPath = path.relative(folderPath, fullPath);

        if (isIgnoredPath(fullPath)) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (shouldScanFile(relPath)) {
          filesScanned++;
          const achadosArquivo = scanFile(relPath);
          achados.push(...achadosArquivo);
        }
      }
    } catch (e) {
      console.error(`Erro ao ler ${dir}: ${e.message}`);
    }
  }

  walk(folderPath);
  return { achados, filesScanned };
}

// ─────────────────────────────────────────────────────────────────
// FORMATAÇÃO SAÍDA
// ─────────────────────────────────────────────────────────────────

function gerarInline(achados, filesScanned) {
  const criticos = achados.filter(a => a.severidade === 'crítico');
  const avisos = achados.filter(a => a.severidade === 'aviso');
  const ok = achados.filter(a => a.severidade === 'ok');

  console.log('\n' + '─'.repeat(70));
  console.log('lgpd-saude-guard — Auditoria LGPD/CFM 2.454');
  console.log('─'.repeat(70));
  console.log(`📁 Pasta: ${process.argv[2] || './'}`);
  console.log(`🔍 Arquivos escaneados: ${filesScanned}`);
  console.log(`⏱️  Achados: ${achados.length}`);
  console.log('\nACHADOS:');
  console.log('─'.repeat(70));

  if (criticos.length > 0) {
    console.log(`\n🔴 CRÍTICO (${criticos.length}):`);
    criticos.forEach(a => {
      console.log(`  • ${a.arquivo}:${a.linha} — ${a.padrao}`);
    });
  } else {
    console.log('\n🔴 CRÍTICO: Nenhum (✅)');
  }

  if (avisos.length > 0) {
    console.log(`\n🟡 AVISO (${avisos.length}):`);
    avisos.forEach(a => {
      console.log(`  • ${a.arquivo}:${a.linha} — ${a.padrao}`);
    });
  } else {
    console.log('\n🟡 AVISO: Nenhum (✅)');
  }

  console.log(`\n🟢 OK: ${ok.length} achados (naturalizado)`);

  console.log('\nRECOMENDAÇÕES:');
  console.log('─'.repeat(70));
  
  const recUnique = [...new Set(achados.map(a => a.recomendacao))];
  recUnique.forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec}`);
  });

  console.log('\n📄 Relatório completo: _lgpd-security-audit.md\n');
}

function gerarMarkdown(achados, filesScanned, folderPath) {
  const criticos = achados.filter(a => a.severidade === 'crítico');
  const avisos = achados.filter(a => a.severidade === 'aviso');
  const ok = achados.filter(a => a.severidade === 'ok');

  const dataAtual = new Date().toISOString();
  const tempoMin = ((Date.now() - global.startTime) / 1000).toFixed(1);

  let md = `# Auditoria LGPD/CFM 2.454 — ${path.basename(folderPath || '.')}\n\n`;
  md += `**Data:** ${dataAtual}\n`;
  md += `**Pasta:** ${folderPath || './'}\n`;
  md += `**Arquivos escaneados:** ${filesScanned}\n`;
  md += `**Duração:** ${tempoMin}s\n\n`;

  md += `## Resumo\n\n`;
  md += `| Categoria | Qtd | Ação |\n`;
  md += `|-----------|-----|------|\n`;
  md += `| 🔴 Crítico | ${criticos.length} | ${criticos.length > 0 ? 'Revisar antes de commit' : 'OK'} |\n`;
  md += `| 🟡 Aviso | ${avisos.length} | ${avisos.length > 0 ? 'Documentar/mitigar' : 'OK'} |\n`;
  md += `| 🟢 OK | ${ok.length} | OK |\n\n`;

  if (criticos.length > 0) {
    md += `## Achados Críticos\n\n`;
    criticos.forEach((a, idx) => {
      md += `### (${idx + 1}) ${a.arquivo}:${a.linha}\n\n`;
      md += `- **Padrão:** ${a.padrao}\n`;
      md += `- **Linha:** \`${a.conteudoLinha}\`\n`;
      md += `- **Norma:** ${a.norma}\n`;
      md += `- **Recomendação:** ${a.recomendacao}\n\n`;
    });
  }

  if (avisos.length > 0) {
    md += `## Achados Aviso\n\n`;
    avisos.forEach((a, idx) => {
      md += `### (${idx + 1}) ${a.arquivo}:${a.linha}\n\n`;
      md += `- **Padrão:** ${a.padrao}\n`;
      md += `- **Linha:** \`${a.conteudoLinha}\`\n`;
      md += `- **Norma:** ${a.norma}\n`;
      md += `- **Recomendação:** ${a.recomendacao}\n\n`;
    });
  }

  md += `## Checklist de ação\n\n`;
  md += `- [ ] Revisar achados críticos com responsável de segurança\n`;
  md += `- [ ] Mover credenciais para .env / AWS Secrets\n`;
  md += `- [ ] Validar dados reais vs fictício\n`;
  md += `- [ ] Confirmar assinaturas médicas em laudos\n`;
  md += `- [ ] Rodar skill de novo após correções\n\n`;

  md += `---\n\n`;
  md += `**Próximo passo:** Resolver todos os itens 🔴 antes de \`commit-github\`.\n`;
  md += `**Referência:** Veja \`lgpd-saude-guard-reference.md\` para detalhes de padrões e normas.\n`;

  return md;
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

async function main() {
  global.startTime = Date.now();

  const folderPath = process.argv[2] || './';

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Pasta não encontrada: ${folderPath}`);
    process.exit(1);
  }

  console.log('🔍 Escaneando...');

  const { achados, filesScanned } = scanFolder(folderPath);

  // Gerar saídas
  gerarInline(achados, filesScanned);
  
  const markdown = gerarMarkdown(achados, filesScanned, folderPath);
  const auditFilename = '_lgpd-security-audit.md';
  fs.writeFileSync(auditFilename, markdown);
  
  console.log(`✅ Relatório salvo: ${auditFilename}\n`);

  // Exit code
  const criticos = achados.filter(a => a.severidade === 'crítico');
  if (criticos.length > 0) {
    console.log(`⚠️  ${criticos.length} achado(s) crítico(s) — revisar antes de commit!\n`);
    process.exit(0); // Não bloqueia (avisar só)
  }
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
