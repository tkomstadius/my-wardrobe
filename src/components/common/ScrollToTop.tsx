import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Component that scrolls to top of page on route change
 * Wrap your app with this component or add to router
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

