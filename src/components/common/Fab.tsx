import { IoAddOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router';
import styles from './Fab.module.css';

type FabProps = {
  path: string;
};

export function Fab({ path }: FabProps) {
  const navigate = useNavigate();

  return (
    <button type="button" className={styles.button} onClick={() => navigate(path)}>
      <IoAddOutline className={styles.icon} />
    </button>
  );
}
