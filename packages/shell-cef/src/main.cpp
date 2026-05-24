// DG Browser — CEF shell entry point.
//
// Authoritative build plan: docs/CHROMIUM_BUILD_PLAN.md
//
// This is the M1 spike target. It boots a single tabbed CEF window that
// loads DG_BRAND_HOME_URL, exposes Chromium DevTools, and stops. Modules
// (Wallet, Agent, x402, Admin) wire in during M2+.

#include "include/cef_app.h"
#include "include/cef_browser.h"
#include "include/cef_command_line.h"

#include "dg_app.h"

#if defined(OS_WIN)
#include <windows.h>
#endif

namespace {
constexpr const char* kSwitchRemoteDebuggingPort = "remote-debugging-port";
constexpr const char* kDefaultRemoteDebuggingPort = "9222";
}  // namespace

int RunDGBrowser(CefMainArgs args) {
  // CefExecuteProcess returns immediately for non-browser sub-processes
  // (renderer, gpu, utility, etc.). Only the browser process continues.
  int sub_exit = CefExecuteProcess(args, nullptr, nullptr);
  if (sub_exit >= 0) {
    return sub_exit;
  }

  CefSettings settings;
  settings.no_sandbox = false;
  settings.windowless_rendering_enabled = false;
  // Expose CDP for packages/agent-bridge integration via Browser Use /
  // OpenClaw browser-use tools. Default 9222; override via flag.
  CefRefPtr<CefCommandLine> cli = CefCommandLine::CreateCommandLine();
  cli->InitFromString(GetCommandLineW());
  if (!cli->HasSwitch(kSwitchRemoteDebuggingPort)) {
    cli->AppendSwitchWithValue(kSwitchRemoteDebuggingPort,
                               kDefaultRemoteDebuggingPort);
  }

  CefRefPtr<DGApp> app(new DGApp());
  CefInitialize(args, settings, app.get(), nullptr);

  // Hand control to CEF until the last window closes.
  CefRunMessageLoop();
  CefShutdown();
  return 0;
}

#if defined(OS_WIN)
int APIENTRY wWinMain(HINSTANCE hInstance, HINSTANCE, LPWSTR, int) {
  CefMainArgs args(hInstance);
  return RunDGBrowser(args);
}
#else
int main(int argc, char* argv[]) {
  CefMainArgs args(argc, argv);
  return RunDGBrowser(args);
}
#endif
