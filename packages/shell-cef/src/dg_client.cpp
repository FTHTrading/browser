#include "dg_client.h"

#include "include/cef_browser.h"

void DGClient::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  // M2: register with the global browser list, push initial brand state
  // (window title from DG_BRAND_NAME, theme bytes from admin-pack).
  (void)browser;
}

bool DGClient::DoClose(CefRefPtr<CefBrowser> browser) {
  (void)browser;
  // Returning false lets the standard close flow proceed.
  return false;
}

void DGClient::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  (void)browser;
  // M2: flush wallet session, persist agent transcript, terminate the
  // sidecar Node process that hosts agent-bridge.
}
