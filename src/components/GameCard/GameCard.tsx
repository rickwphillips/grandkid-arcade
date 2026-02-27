import styles from './GameCard.module.scss';
import { GameCardProps } from './GameCard.types';

export default function GameCard({ game }: GameCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnailContainer}>
        <img 
          src={game.imageUrl} 
          className={styles.thumbnail} 
          alt={game.title} 
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{game.title}</h3>
        <p className={styles.description}>{game.description}</p>
      </div>
    </div>
  );
}