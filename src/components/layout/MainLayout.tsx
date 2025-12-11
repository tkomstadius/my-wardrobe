import { Outlet, useLocation } from "react-router";
import { BottomNav } from "./BottomNav";
import { ScrollToTop } from "../common/ScrollToTop";
import styles from "./MainLayout.module.css";

const PAGES_WITHOUT_BOTTOM_NAV = ["/add-item"];

export function MainLayout() {
  const location = useLocation();

  // Hide bottom nav on form pages (add/edit item)
  const shouldShowBottomNav =
    !PAGES_WITHOUT_BOTTOM_NAV.includes(location.pathname) &&
    !location.pathname.startsWith("/edit-item/");

  return (
    <div className={styles.layout}>
      <ScrollToTop />
      <header className={styles.header}>
        <h1 className={styles.logo}>WardrobeTracker</h1>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      {shouldShowBottomNav && <BottomNav />}
    </div>
  );
}
