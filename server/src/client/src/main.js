import './app.scss';
import './context-menu.scss';
import './snack-bar.scss';

import App from './App.svelte';

const app = new App({
  target: document.getElementById('app'),
});

export default app;
