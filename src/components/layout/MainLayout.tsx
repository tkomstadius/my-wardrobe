import { IoBarChartOutline, IoSettingsOutline } from 'react-icons/io5';
import { Outlet, useNavigate, useNavigation } from 'react-router';
import { useWeather } from '../../contexts/WeatherContext';
import { ScrollToTop } from '../common/ScrollToTop';
import { ErrorBoundary } from '../common/ui/ErrorBoundary';
import { Flex } from '../common/ui/Flex';
import { IconButton } from '../common/ui/IconButton';
import { Text } from '../common/ui/Text';
import { BottomNav } from './BottomNav';
import styles from './MainLayout.module.css';

export function MainLayout() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { weatherData, isLoading } = useWeather();
  const isNavigating = navigation.state === 'loading';

  return (
    <Flex direction="column" className={styles.layout}>
      <ScrollToTop />
      <header className={styles.header}>
        {isNavigating && <div className={styles.progressBar} />}
        <Flex justify="between" align="center">
          <h1 className={styles.name}>My Wardrobe</h1>
          <Flex align="center" gap="4">
            <IconButton
              size="3"
              onClick={() => navigate('/settings')}
              className={styles.iconButton}
            >
              <IoSettingsOutline size={20} />
            </IconButton>
            <IconButton size="3" onClick={() => navigate('/stats')} className={styles.iconButton}>
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
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </Flex>
  );
}
