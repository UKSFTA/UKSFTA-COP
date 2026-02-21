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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Dependencies..."
    npm install
fi

# PHYSICAL COPY of tiles and metadata
if [ -f "$PROJECT_ROOT/theatre_archive/all.js" ]; then
    mkdir -p static/theatre
    cp "$PROJECT_ROOT/theatre_archive/all.js" "static/theatre/all.js"
fi

for d in "$PROJECT_ROOT/theatre_archive"/*; do
    if [ -d "$d" ]; then
        name=$(basename "$d")
        cp -r "$d" "static/theatre/$name" 2>/dev/null
    fi
done

# Use npm run dev which handles asset copying and Hugo server
npm run dev
