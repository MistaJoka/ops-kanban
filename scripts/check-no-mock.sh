#!/usr/bin/env bash
# NO_MOCK_DATA_POLICY.md §6 — fail if test fixtures imported in app code
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

echo "Checking for mock/sample imports in production paths..."

if rg -n "from ['\"].*tests/|from ['\"]@/tests|require\\(['\"].*tests/" "$ROOT/app" "$ROOT/components" "$ROOT/lib" 2>/dev/null; then
  echo "FAIL: test imports in app/components/lib"
  FAIL=1
fi

if rg -n "mockCards|sampleData|DEMO_CARDS|fakeJobs|lorem" "$ROOT/app" "$ROOT/components" "$ROOT/lib/domain" 2>/dev/null; then
  echo "FAIL: mock/sample identifiers in production paths"
  FAIL=1
fi

if rg -n "Wire this to the matching domain service" "$ROOT/app" "$ROOT/lib" 2>/dev/null; then
  echo "FAIL: AI executor stub message still present"
  FAIL=1
fi

if [ "$FAIL" -eq 0 ]; then
  echo "OK: no-mock static checks passed"
  exit 0
else
  exit 1
fi
