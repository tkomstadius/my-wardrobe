import { Outlet, useNavigate } from "react-router";
import { BottomNav } from "./BottomNav";
import { ScrollToTop } from "../common/ScrollToTop";
import styles from "./MainLayout.module.css";
import { IoBarChartOutline, IoSettingsOutline } from "react-icons/io5";
import { Flex } from "../common/ui/Flex";
import { IconButton } from "../common/ui/IconButton";
import { Text } from "../common/ui/Text";
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
              size="3"
              onClick={() => navigate("/settings")}
              className={styles.iconButton}
            >
              <IoSettingsOutline size={20} />
            </IconButton>
            <IconButton
              size="3"
              onClick={() => navigate("/stats")}
              className={styles.iconButton}
            >
              <IoBarChartOutline size={20} />
            </IconButton>
          </Flex>
        </Flex>
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
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </Flex>
  );
}
