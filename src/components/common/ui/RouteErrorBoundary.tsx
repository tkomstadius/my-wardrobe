import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import styles from './ErrorBoundary.module.css';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred.';
  let details = '';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || error.data || 'Route error';
    details = JSON.stringify(error, null, 2);
  } else if (error instanceof Error) {
    message = error.message;
    details = error.stack || '';
  } else if (typeof error === 'string') {
    message = error;
  } else {
    details = JSON.stringify(error, null, 2);
  }

  const handleRetry = () => {
    navigate(0); // Refresh current route
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        {details && (
          <details className={styles.details} open>
            <summary>Error details</summary>
            <pre className={styles.stack}>{details}</pre>
          </details>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className={styles.retryButton} onClick={handleRetry}>
            Try Again
          </button>
          <button type="button" className={styles.retryButton} onClick={handleGoHome}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
