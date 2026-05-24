#include "dg_app.h"

#include "include/cef_browser.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"

#include "dg_client.h"
#include "dg_window.h"

#ifndef DG_BRAND_HOME_URL
#define DG_BRAND_HOME_URL "about:blank"
#endif

void DGApp::OnContextInitialized() {
  CefRefPtr<DGClient> client(new DGClient());

  CefBrowserSettings browser_settings;
  CefRefPtr<CefBrowserView> browser_view = CefBrowserView::CreateBrowserView(
      client.get(), DG_BRAND_HOME_URL, browser_settings, nullptr, nullptr,
      nullptr);

  CefWindow::CreateTopLevelWindow(new DGWindowDelegate(browser_view));
}
