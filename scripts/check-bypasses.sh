#!/usr/bin/env bash
# scripts/check-bypasses.sh
# CI/CD gate: detecta chamadas HTTP diretas (axios/fetch) sem apiClient nos diretórios admin.
# Uso: bash scripts/check-bypasses.sh
# Retorna exit 1 se encontrar bypasses, exit 0 se estiver limpo.

set -euo pipefail

SEARCH_DIRS=(
  "src/app/admin"
  "src/components/admin"
)

# Padrões que indicam bypass direto (sem apiClient)
BYPASS_PATTERNS=(
  "import axios"
  "from ['\"]axios['\"]"
  "axios\.get\("
  "axios\.post\("
  "axios\.put\("
  "axios\.patch\("
  "axios\.delete\("
  "adminFetchJson\("
)

# Padrões de fetch direto para endpoints admin (exceto viacep e outros externos)
FETCH_ADMIN_PATTERN="fetch\(['\"\`][^'\"]*\/api\/admin"

FOUND=0

echo "🔍 Verificando bypasses de CSRF em diretórios admin..."

for dir in "${SEARCH_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "  ⚠️  Diretório não encontrado: $dir (ignorando)"
    continue
  fi

  for pattern in "${BYPASS_PATTERNS[@]}"; do
    matches=$(grep -rn --include="*.tsx" --include="*.ts" -E "$pattern" "$dir" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo ""
      echo "❌ BYPASS DETECTADO (padrão: $pattern):"
      echo "$matches"
      FOUND=1
    fi
  done

  # Verifica fetch() direto para endpoints admin
  matches=$(grep -rn --include="*.tsx" --include="*.ts" -E "$FETCH_ADMIN_PATTERN" "$dir" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo ""
    echo "❌ FETCH DIRETO para /api/admin DETECTADO (use apiClient):"
    echo "$matches"
    FOUND=1
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "✅ Nenhum bypass encontrado. Todos os endpoints admin usam apiClient."
  exit 0
else
  echo ""
  echo "💡 Para corrigir: substitua axios/fetch por apiClient (src/lib/apiClient.ts)."
  echo "   Exemplo: apiClient.post('/api/admin/...', payload)"
  exit 1
fi
