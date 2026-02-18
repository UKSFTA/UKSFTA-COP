#!/usr/bin/env bash
# UKSFTA-COP High-Speed Development Launcher
# Bypasses Hugo's slow static file processing using direct path staging

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

if [ -f .env ]; then
    echo "🔐 Loading credentials..."
    export HUGO_PARAMS_SUPABASEURL=$(grep SUPABASE_URL .env | cut -d '=' -f2 | xargs)
    export HUGO_PARAMS_SUPABASESERVICEROLEKEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2 | xargs)
else
    echo "❌ Error: .env file not found."
    exit 1
fi

echo "🚀 Starting Intelligence Portal..."
cd web

# We use Hugo's built-in server but tell it to use / as the base during dev
# This resolves the 404 errors caused by the production /UKSFTA-COP/ path.
# We still symlink the archive so Hugo doesn't try to process 300k files.

mkdir -p static/theatre
# Link every theatre in the archive to static/theatre
echo "🔗 Staging Intelligence Archive..."
for d in "$PROJECT_ROOT/theatre_archive"/*; do
    if [ -d "$d" ]; then
        name=$(basename "$d")
        if [ ! -L "static/theatre/$name" ]; then
            ln -s "$d" "static/theatre/$name"
        fi
    fi
done

# Run Hugo Server
# --baseURL / ensure assets load from localhost:1313/ instead of localhost:1313/UKSFTA-COP/
hugo server --baseURL http://localhost:1313/ --port 1313 --buildDrafts --disableFastRender
