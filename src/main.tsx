import { createRoot } from 'react-dom/client'
import './shadcn.css'
import './i18n/config'
import App from './App'

const root = createRoot(document.getElementById('app')!)
root.render(<App />)
