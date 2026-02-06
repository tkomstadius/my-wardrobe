import { Outlet, useNavigation } from 'react-router';
import { useWeather } from '../../contexts/WeatherContext';
import { ScrollToTop } from '../common/ScrollToTop';
import { ErrorBoundary } from '../common/ui/ErrorBoundary';
import { Flex } from '../common/ui/Flex';
import { Text } from '../common/ui/Text';
import { BottomNav } from './BottomNav';
import styles from './MainLayout.module.css';

export function MainLayout() {
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
          {weatherData && !isLoading && (
            <div className={styles.weatherPill}>
              <Text size="1" className={styles.weatherText}>
                {weatherData.actualTemp} · Feels {weatherData.feelsLikeTemp} · Rain{' '}
                {weatherData.precipitation}
              </Text>
            </div>
          )}
        </Flex>
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
