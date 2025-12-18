#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🤖 AGENT VERIFICATION PROTOCOL INITIATED..."

# 1. Linting Check (Fail fast on syntax errors)
echo "--- 1. Checking Syntax & Linting ---"
# Assuming eslint is set up
npm run lint --if-present

# 2. Type Checking (TypeScript)
echo "--- 2. Checking Types ---"
npm run tsc --noEmit --if-present

# 3. Unit Tests (Logic verification)
echo "--- 3. Running Unit Tests ---"
# We expect the agent to use Vitest or Jest
npm run test:unit

# 4. Integration/Build Check (Ensure it actually builds)
echo "--- 4. Verifying Build ---"
npm run build

echo "✅ VERIFICATION SUCCESSFUL. Code is ready."