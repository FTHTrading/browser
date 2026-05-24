# DG Browser — CEF shell, M1 spike
#
# Authoritative build plan: docs/CHROMIUM_BUILD_PLAN.md
# Engine: Chromium Embedded Framework (CEF) 146.x LTS
# Tracks: https://bitbucket.org/chromiumembedded/cef
#
# This CMakeLists is the M1 starting point. It is intentionally minimal:
# a single tabbed browser window with the DG side rail, no modules wired
# yet. M2+ slots in dg-wallet, agent-bridge IPC, etc.

cmake_minimum_required(VERSION 3.21)
project(dg_browser_shell LANGUAGES CXX VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# -----------------------------------------------------------------------------
# CEF binary distribution.
#
# The CEF binary dist is platform-specific and large (~1 GB). It is NOT
# vendored. Drop it into vendor/cef-${CEF_PLATFORM}/ and point CEF_ROOT.
#
#   macOS arm64:  cef_binary_146.0.11+ge..._macosarm64.tar.bz2
#   Windows x64:  cef_binary_146.0.11+ge..._windows64.tar.bz2
#   Linux x64:    cef_binary_146.0.11+ge..._linux64.tar.bz2
#
# Get distributions from:
#   https://cef-builds.spotifycdn.com/index.html
# -----------------------------------------------------------------------------
if(NOT DEFINED CEF_ROOT)
    if(APPLE)
        set(CEF_PLATFORM "macosarm64")
    elseif(WIN32)
        set(CEF_PLATFORM "windows64")
    elseif(UNIX)
        set(CEF_PLATFORM "linux64")
    endif()
    set(CEF_ROOT "${CMAKE_SOURCE_DIR}/vendor/cef-${CEF_PLATFORM}")
endif()

if(NOT EXISTS "${CEF_ROOT}/cmake")
    message(FATAL_ERROR
        "CEF distribution not found at ${CEF_ROOT}. "
        "Download from https://cef-builds.spotifycdn.com/index.html "
        "and extract into vendor/cef-<platform>/. "
        "See docs/CHROMIUM_BUILD_PLAN.md §1.")
endif()

list(APPEND CMAKE_MODULE_PATH "${CEF_ROOT}/cmake")
find_package(CEF REQUIRED)

add_subdirectory("${CEF_ROOT}/libcef_dll" libcef_dll_wrapper)

# -----------------------------------------------------------------------------
# DG Browser shell executable.
# -----------------------------------------------------------------------------
set(DG_SHELL_SOURCES
    src/main.cpp
    src/dg_app.cpp
    src/dg_app.h
    src/dg_client.cpp
    src/dg_client.h
    src/dg_window.cpp
    src/dg_window.h
)

add_executable(dg_browser_shell ${DG_SHELL_SOURCES})

target_link_libraries(dg_browser_shell
    PRIVATE
    libcef_lib
    libcef_dll_wrapper
)

target_include_directories(dg_browser_shell PRIVATE
    "${CEF_ROOT}"
    src/
)

SET_EXECUTABLE_TARGET_PROPERTIES(dg_browser_shell)

# Branding strings injected at build time. White-label customers override
# via cmake -DDG_BRAND_NAME="Acme Browser" -DDG_BRAND_ACCENT="#00AAFF" etc.
# Default values describe the unbranded DG dev build.
set(DG_BRAND_NAME "Digital Giant Browser" CACHE STRING "Window + about-page brand")
set(DG_BRAND_VERSION "${PROJECT_VERSION}" CACHE STRING "Reported build version")
set(DG_BRAND_HOME_URL "https://digitalgiant.xyz/browser/" CACHE STRING "Default home page")
target_compile_definitions(dg_browser_shell PRIVATE
    DG_BRAND_NAME="${DG_BRAND_NAME}"
    DG_BRAND_VERSION="${DG_BRAND_VERSION}"
    DG_BRAND_HOME_URL="${DG_BRAND_HOME_URL}"
)
