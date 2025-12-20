import { Outlet, useNavigate } from "react-router";
import { BottomNav } from "./BottomNav";
import { ScrollToTop } from "../common/ScrollToTop";
import styles from "./MainLayout.module.css";
import { BarChartIcon, GearIcon } from "@radix-ui/react-icons";
import { Flex, IconButton } from "@radix-ui/themes";

export function MainLayout() {
  const navigate = useNavigate();

  return (
    <Flex direction="column" className={styles.layout}>
      <ScrollToTop />
      <header className={styles.header}>
        <Flex justify="between" align="center">
          <h1 className={styles.name}>My Wardrobe</h1>
          <Flex align="center" gap="4">
            <IconButton
              variant="ghost"
              size="3"
              onClick={() => navigate("/settings")}
              aria-label="Settings"
              className={styles.iconButton}
            >
              <GearIcon width="20" height="20" />
            </IconButton>
            <IconButton
              variant="ghost"
              size="3"
              onClick={() => navigate("/stats")}
              aria-label="Statistics"
              className={styles.iconButton}
            >
              <BarChartIcon width="20" height="20" />
            </IconButton>
          </Flex>
        </Flex>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </Flex>
  );
}
