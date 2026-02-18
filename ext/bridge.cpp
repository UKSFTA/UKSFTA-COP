#include <iostream>
#include <string>
#include <array>
#include <memory>
#include <stdexcept>

#ifdef _WIN32
#define EXPORT __declspec(dllexport)
#else
#define EXPORT __attribute__((visibility("default")))
#endif

extern "C" {
    EXPORT void RVExtension(char *output, int outputSize, const char *function);
}

std::string exec(const char* cmd) {
    std::array<char, 128> buffer;
    std::string result;
#ifdef _WIN32
    std::unique_ptr<FILE, decltype(&_pclose)> pipe(_popen(cmd, "r"), _pclose);
#else
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
#endif
    if (!pipe) {
        return "[\"error\", \"Failed to start extension process\"]";
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    return result;
}

void RVExtension(char *output, int outputSize, const char *function) {
    // Escape the function parameter to prevent shell injection if needed, 
    // but for now we trust the internal call.
    std::string cmd = "python3 ext/uksfta_cop_ext.py \"" + std::string(function) + "\"";
    std::string result = exec(cmd.c_str());
    
    size_t len = result.copy(output, outputSize - 1);
    output[len] = '\0';
}
