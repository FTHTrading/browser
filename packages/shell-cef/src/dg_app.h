// DGApp — top-level CEF application object.
//
// Owns the browser-process handlers and bootstraps the first window.

#pragma once

#include "include/cef_app.h"
#include "include/cef_browser_process_handler.h"

class DGApp : public CefApp, public CefBrowserProcessHandler {
 public:
  DGApp() = default;
  DGApp(const DGApp&) = delete;
  DGApp& operator=(const DGApp&) = delete;

  // CefApp
  CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override {
    return this;
  }

  // CefBrowserProcessHandler
  void OnContextInitialized() override;

 private:
  IMPLEMENT_REFCOUNTING(DGApp);
};
