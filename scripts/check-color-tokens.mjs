#!/usr/bin/env node

/**
 * check-color-tokens.mjs
 *
 * Detecta cores hardcoded em arquivos .tsx/.ts do projeto.
 * Roda no CI como gate bloqueante e localmente via `npm run lint:colors`.
 *
 * O que bloqueia:
 *   - Classes Tailwind arbitrarias de cor: bg-[#xxx], text-[#xxx], border-[#xxx], etc.
 *   - Inline styles com hex: color: "#xxx", backgroundColor: "#xxx"
 *   - SVG props com hex: fill="#xxx", stroke="#xxx"
 *   - Constantes JS com hex: const X = "#xxx"
 *
 * O que NAO bloqueia (excecoes):
 *   - Shadows com rgba: shadow-[0_10px_30px_rgba(...)]
 *   - Patterns decorativos: radial-gradient(#ffffff33 ...)
 *   - Arquivos de config: globals.css, tailwind.config.ts
 *   - Testes (__tests__/)
 *   - node_modules, .next, dist
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const SRC = join(process.cwd(), "src");

// ── Patterns que detectam hardcodes ──────────────────────────────────

// Tailwind arbitrary color classes (bg-[#xxx], text-[#xxx], border-[#xxx], etc.)
// Captura: prefixo-[#hex] incluindo variantes hover:, focus:, etc.
const RE_TW_ARBITRARY =
  /(?:(?:hover|focus|active|focus-visible|focus-within|group-hover|peer-focus|file|placeholder):)*(?:bg|text|border|ring|from|to|via|outline|caret|fill|stroke|accent|decoration|shadow)-\[#[0-9a-fA-F]{3,8}\]/g;

// Inline style hex: color: "#xxx", backgroundColor: "#xxx"
const RE_INLINE_HEX =
  /(?:color|backgroundColor|borderColor|background)\s*:\s*["']#[0-9a-fA-F]{3,8}["']/g;

// SVG props: fill="#xxx", stroke="#xxx"
const RE_SVG_HEX = /(?:fill|stroke)=["']#[0-9a-fA-F]{3,8}["']/g;

// JS constant hex: = "#xxxxxx" (6+ chars to avoid short strings)
const RE_CONST_HEX = /=\s*["']#[0-9a-fA-F]{6,8}["']/g;

// ── Excecoes ─────────────────────────────────────────────────────────

// Patterns que sao excecoes aceitas (nao sao cores de tema)
function isException(line) {
  const trimmed = line.trim();

  // Shadows com rgba (valores compostos)
  if (/shadow-\[.*rgba\(/.test(trimmed)) return true;

  // Patterns decorativos com hex+alpha (ex: #ffffff33)
  if (/gradient\(#[0-9a-fA-F]{8}/.test(trimmed)) return true;

  // Linhas que sao comentarios
  if (/^\s*\/\//.test(trimmed) || /^\s*\*/.test(trimmed)) return true;

  // expect() em testes (assertions de className)
  if (/expect\(/.test(trimmed)) return true;

  return false;
}

// Arquivos/diretorios ignorados
function shouldSkip(filePath) {
  const rel = relative(SRC, filePath).replace(/\\/g, "/");
  if (rel.startsWith("__tests__/")) return true;
  if (rel.includes("node_modules")) return true;
  if (rel.includes(".next")) return true;
  return false;
}

// Arquivos de config que definem os tokens (fonte de verdade)
function isTokenSource(filePath) {
  const name = filePath.replace(/\\/g, "/");
  if (name.endsWith("globals.css")) return true;
  if (name.endsWith("tailwind.config.ts")) return true;
  return false;
}

// ── Scanner ──────────────────────────────────────────────────────────

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkDir(full));
    } else {
      const ext = extname(full);
      if ([".tsx", ".ts", ".jsx", ".js"].includes(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isException(line)) continue;

    const patterns = [
      { re: RE_TW_ARBITRARY, type: "Tailwind arbitrary color" },
      { re: RE_INLINE_HEX, type: "Inline style hex" },
      { re: RE_SVG_HEX, type: "SVG hex color" },
      { re: RE_CONST_HEX, type: "JS constant hex" },
    ];

    for (const { re, type } of patterns) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(line)) !== null) {
        violations.push({
          line: i + 1,
          column: match.index + 1,
          match: match[0],
          type,
        });
      }
    }
  }

  return violations;
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  const files = walkDir(SRC);
  let totalViolations = 0;
  const report = [];

  for (const file of files) {
    if (shouldSkip(file) || isTokenSource(file)) continue;

    const violations = scanFile(file);
    if (violations.length > 0) {
      totalViolations += violations.length;
      const rel = relative(process.cwd(), file).replace(/\\/g, "/");
      report.push({ file: rel, violations });
    }
  }

  if (totalViolations === 0) {
    console.log("\x1b[32m✓ Nenhuma cor hardcoded encontrada. Tokens OK.\x1b[0m");
    process.exit(0);
  }

  console.log(
    `\x1b[31m✗ ${totalViolations} cor(es) hardcoded encontrada(s):\x1b[0m\n`,
  );

  for (const { file, violations } of report) {
    console.log(`  \x1b[36m${file}\x1b[0m`);
    for (const v of violations) {
      console.log(
        `    L${v.line}:${v.column}  \x1b[33m${v.type}\x1b[0m  ${v.match}`,
      );
    }
    console.log();
  }

  console.log(
    "\x1b[90mUse tokens de cor definidos em globals.css + tailwind.config.ts.",
  );
  console.log("Veja COLORS.md para o catalogo completo de tokens.\x1b[0m\n");

  console.log(
    "\x1b[90mSe a cor e uma excecao aceita (shadow rgba, pattern decorativo),",
  );
  console.log(
    "verifique se o arquivo/linha esta na lista de excecoes do script.\x1b[0m",
  );

  process.exit(1);
}

main();
