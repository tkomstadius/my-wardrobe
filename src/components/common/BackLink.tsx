import { IoArrowBackOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useGoBack } from '../../hooks/useBackNavigation';
import styles from './BackLink.module.css';

type BackButtonProps = {
  /** Where to go when there's no in-app history to return to (e.g. after a reload) */
  to: string;
};

export function BackLink({ to }: BackButtonProps) {
  const goBack = useGoBack(to);

  return (
    <Link
      to={to}
      className={styles.link}
      aria-label="Back"
      onClick={(e) => {
        e.preventDefault();
        goBack();
      }}
    >
      <IoArrowBackOutline />
    </Link>
  );
}
