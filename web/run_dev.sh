#!/usr/bin/env bash
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

if [ -f .env ]; then
    # Load and export precisely
    export HUGO_PARAMS_SUPABASEURL=$(grep SUPABASE_URL .env | cut -d '=' -f2 | xargs)
    export HUGO_PARAMS_SUPABASESERVICEROLEKEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2 | xargs)
fi

echo "🚀 MOD UPLINK: Starting Intelligence Portal..."
cd web
mkdir -p static/theatre static/assets/fonts

# STAGE MOD FONTS
if [ -d "node_modules/govuk-frontend/dist/govuk/assets/fonts" ]; then
    cp -r node_modules/govuk-frontend/dist/govuk/assets/fonts/* static/assets/fonts/
fi

# PHYSICAL COPY of tiles and metadata
if [ -f "$PROJECT_ROOT/theatre_archive/all.js" ]; then
    cp "$PROJECT_ROOT/theatre_archive/all.js" "static/theatre/all.js"
fi

for d in "$PROJECT_ROOT/theatre_archive"/*; do
    if [ -d "$d" ]; then
        name=$(basename "$d")
        cp -r "$d" "static/theatre/$name" 2>/dev/null
    fi
done

hugo server --bind 0.0.0.0 --baseURL http://127.0.0.1:1313/ --port 1313 --buildDrafts --disableFastRender
