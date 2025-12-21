import { Outlet, useNavigate } from "react-router";
import { BottomNav } from "./BottomNav";
import { ScrollToTop } from "../common/ScrollToTop";
import styles from "./MainLayout.module.css";
import { BarChartIcon, GearIcon } from "@radix-ui/react-icons";
import { Flex, IconButton, Text } from "@radix-ui/themes";
import { useWeather } from "../../contexts/WeatherContext";

export function MainLayout() {
  const navigate = useNavigate();
  const { weatherData, isLoading } = useWeather();

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
        {weatherData && !isLoading && (
          <Flex gap="2" align="center" justify="end">
            <Text size="1" className={styles.weatherText}>
              Actual: {weatherData.actualTemp}
            </Text>
            <Text size="1" className={styles.weatherText}>
              Feels: {weatherData.feelsLikeTemp}
            </Text>
            <Text size="1" className={styles.weatherText}>
              Rain: {weatherData.precipitation}
            </Text>
          </Flex>
        )}
        <Outlet />
      </main>
      <BottomNav />
    </Flex>
  );
}
