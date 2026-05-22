#!/usr/bin/env bash
# NO_MOCK_DATA_POLICY.md §6 + §8 (V1–V7 static checks)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

echo "Checking for mock/sample imports in production paths..."

if rg -n "from ['\"].*tests/|from ['\"]@/tests|require\\(['\"].*tests/" "$ROOT/app" "$ROOT/components" "$ROOT/lib" 2>/dev/null; then
  echo "FAIL: test imports in app/components/lib"
  FAIL=1
fi

if rg -n "mockCards|sampleData|DEMO_CARDS|DEMO_|fakeJobs|lorem" "$ROOT/app" "$ROOT/components" "$ROOT/lib/domain" 2>/dev/null; then
  echo "FAIL: mock/sample identifiers in production paths (V2)"
  FAIL=1
fi

if rg -n "Wire this to the matching domain service|Implement domain service in Phase 5|Tool executor not wired" "$ROOT/app" "$ROOT/lib" 2>/dev/null; then
  echo "FAIL: AI executor stub message still present (V6)"
  FAIL=1
fi

if rg -n "/\\*\\s*mock|fixture\\s*\\*/" "$ROOT/app" "$ROOT/components" 2>/dev/null; then
  echo "FAIL: mock/fixture comment markers in UI paths"
  FAIL=1
fi

for dir in app components lib/domain; do
  if find "$ROOT/$dir" -type f \( -name '*mock*' -o -name '*fixture*' -o -name '*sample*' \) 2>/dev/null | grep -q .; then
    find "$ROOT/$dir" -type f \( -name '*mock*' -o -name '*fixture*' -o -name '*sample*' \) 2>/dev/null
    echo "FAIL: mock/fixture/sample filenames under $dir"
    FAIL=1
  fi
done

if rg -n "const (cards|customers)\\s*=\\s*\\[" "$ROOT/app" "$ROOT/components" 2>/dev/null; then
  echo "WARN: hardcoded array — review for mock data (V2 manual)"
fi

if [ "$FAIL" -eq 0 ]; then
  echo "OK: no-mock static checks passed (V2, V6)"
  exit 0
else
  exit 1
fi
