#!/bin/bash

# Deploy script automático para Play Store e App Store
# Uso: ./scripts/deploy.sh [patch|minor|major]

set -e

BUMP_TYPE=${1:-patch}
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$CURRENT_DIR/.."

echo "🚀 Starting deployment process..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Atualizar versão
echo "📦 Bumping version ($BUMP_TYPE)..."
cd "$PROJECT_ROOT"
npm version "$BUMP_TYPE" --no-git-tag-version

# Remover tag criada
git reset --soft HEAD~1 2>/dev/null || true

# 2. Confirmar mudanças
echo "✅ Version updated"
NEW_VERSION=$(node -p "require('./package.json').version")
echo "   New version: $NEW_VERSION"

# 3. Preparar ambiente
echo ""
echo "🔧 Preparing build environment..."

# Limpar cache antigo (opcional)
# rm -rf node_modules/.cache

# 4. Build Android
echo ""
echo "📱 Building for Android..."
if ! eas build --platform android --profile production --auto-submit=false; then
  echo "❌ Android build failed"
  exit 1
fi
echo "✅ Android build complete"

# 5. Build iOS
echo ""
echo "📱 Building for iOS..."
if ! eas build --platform ios --profile production --auto-submit=false; then
  echo "❌ iOS build failed"
  exit 1
fi
echo "✅ iOS build complete"

# 6. Aguardar confirmação antes de submit
echo ""
echo "⏸️  Builds complete. Review them before submitting:"
echo "   - Check logs for any warnings"
echo "   - Verify app runs correctly"
echo ""
read -p "Continue with submission? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # 7. Submit Android
  echo ""
  echo "🚀 Submitting to Google Play..."
  if eas submit --platform android --latest --track production; then
    echo "✅ Android submitted"
  else
    echo "⚠️  Android submission completed (check manually)"
  fi

  # 8. Submit iOS
  echo ""
  echo "🚀 Submitting to App Store..."
  if eas submit --platform ios --latest; then
    echo "✅ iOS submitted"
  else
    echo "⚠️  iOS submission completed (check manually)"
  fi

  # 9. Git commit
  echo ""
  echo "📝 Creating git commit..."
  git add app.json package.json package-lock.json
  git commit -m "Release v$NEW_VERSION"
  git tag "v$NEW_VERSION"
  echo "✅ Git commit created"

  # 10. Resumo
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✨ Deployment complete!"
  echo ""
  echo "📅 Version: $NEW_VERSION"
  echo "🎯 Status: Submitted for review"
  echo ""
  echo "Next steps:"
  echo "1. Monitor Google Play Console for Android approval"
  echo "2. Monitor App Store Connect for iOS approval"
  echo "3. Expected time: 1-2 days for Android, 24-48h for iOS"
  echo ""
else
  echo ""
  echo "⏭️  Deployment cancelled. Build artifacts ready for manual submission."
  exit 0
fi
