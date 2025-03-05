import './assets/index.css'
import { render } from 'solid-js/web'
import App from './App'

// Initialize theme from localStorage if available
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

render(() => <App />, document.getElementById('root') as HTMLElement)
