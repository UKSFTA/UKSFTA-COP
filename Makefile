# UKSFTA-COP Extension Makefile
# Outputs binaries directly to project root for HEMTT packaging

CC_LINUX := g++
CC_WINDOWS := x86_64-w64-mingw32-g++

all: linux

linux:
	@if command -v $(CC_LINUX) >/dev/null 2>&1; then \
		echo "🛠️  Compiling Linux Extension..."; \
		$(CC_LINUX) -shared -fPIC -O2 ext/bridge.cpp -o uksfta_cop_ext_x64.so; \
		echo "✅ Linux Build Complete."; \
	else \
		echo "❌ Error: $(CC_LINUX) not found. Cannot build Linux extension."; \
	fi

windows:
	@if command -v $(CC_WINDOWS) >/dev/null 2>&1; then \
		echo "🛠️  Compiling Windows Extension..."; \
		$(CC_WINDOWS) -shared -O2 ext/bridge.cpp -o uksfta_cop_ext_x64.dll; \
		echo "✅ Windows Build Complete."; \
	else \
		echo "⚠️  Warning: $(CC_WINDOWS) not found. Skipping Windows extension build."; \
		echo "💡 Note: Install 'mingw-w64' to build for Windows."; \
	fi

clean:
	rm -f *.so *.dll
