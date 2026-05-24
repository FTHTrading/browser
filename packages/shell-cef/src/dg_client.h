// DGClient — per-browser handler. Catches title changes, navigation events,
// console messages, and lifecycle so the native chrome can update.
//
// During M1 this is intentionally thin. M2 plugs in DG Wallet sign-request
// interception via CefRequestHandler::OnBeforeBrowse + CefResourceRequestHandler.

#pragma once

#include "include/cef_client.h"
#include "include/cef_life_span_handler.h"

class DGClient : public CefClient, public CefLifeSpanHandler {
 public:
  DGClient() = default;
  DGClient(const DGClient&) = delete;
  DGClient& operator=(const DGClient&) = delete;

  // CefClient
  CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override { return this; }

  // CefLifeSpanHandler
  void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
  bool DoClose(CefRefPtr<CefBrowser> browser) override;
  void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

 private:
  IMPLEMENT_REFCOUNTING(DGClient);
};
