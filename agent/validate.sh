#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🤖 AGENT VERIFICATION PROTOCOL INITIATED..."

# 1. Linting Check (Fail fast on syntax errors)
echo "--- 1. Checking Syntax & Linting ---"
npm run lint

# 2. Type Checking (TypeScript)
echo "--- 2. Checking Types ---"
npx tsc --noEmit

# 3. Unit Tests (Logic verification)
echo "--- 3. Running Unit Tests ---"
npm run test:run

# 4. Integration/Build Check (Ensure it actually builds)
echo "--- 4. Verifying Build ---"
npm run build

# 5. End-to-End Tests (Complete game flow verification)
echo "--- 5. Running End-to-End Tests ---"
npm run test:e2e

echo "✅ VERIFICATION SUCCESSFUL. Code is ready."