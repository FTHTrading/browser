#include "dg_window.h"

#include "include/views/cef_window.h"

void DGWindowDelegate::OnWindowCreated(CefRefPtr<CefWindow> window) {
  window->AddChildView(browser_view_);
  window->SetTitle(DG_BRAND_NAME);
  window->Show();
  browser_view_->RequestFocus();
}

void DGWindowDelegate::OnWindowDestroyed(CefRefPtr<CefWindow> window) {
  (void)window;
  browser_view_ = nullptr;
}

bool DGWindowDelegate::CanClose(CefRefPtr<CefWindow> window) {
  (void)window;
  // M2: warn on unsaved wallet sessions, agent in-flight, etc.
  return true;
}
