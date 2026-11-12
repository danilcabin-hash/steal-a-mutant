import './style.css';
import { Game } from './core/Game';

const game = new Game();
import.meta.hot?.dispose(() => game.dispose());
