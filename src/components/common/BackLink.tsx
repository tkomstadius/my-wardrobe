import { IoArrowBackOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import styles from './BackLink.module.css';

type BackButtonProps = {
  to: string;
};

export function BackLink({ to }: BackButtonProps) {
  return (
    <Link to={to} className={styles.link}>
      <IoArrowBackOutline />
    </Link>
  );
}
