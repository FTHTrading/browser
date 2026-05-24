// DGWindowDelegate — top-level window placement and title.

#pragma once

#include "include/views/cef_browser_view.h"
#include "include/views/cef_window_delegate.h"

#ifndef DG_BRAND_NAME
#define DG_BRAND_NAME "Digital Giant Browser"
#endif

class DGWindowDelegate : public CefWindowDelegate {
 public:
  explicit DGWindowDelegate(CefRefPtr<CefBrowserView> view)
      : browser_view_(view) {}

  void OnWindowCreated(CefRefPtr<CefWindow> window) override;
  void OnWindowDestroyed(CefRefPtr<CefWindow> window) override;
  bool CanClose(CefRefPtr<CefWindow> window) override;
  CefSize GetPreferredSize(CefRefPtr<CefView>) override {
    return CefSize(1280, 800);
  }

 private:
  CefRefPtr<CefBrowserView> browser_view_;

  IMPLEMENT_REFCOUNTING(DGWindowDelegate);
};
