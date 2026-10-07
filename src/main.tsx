import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('No se encontró el contenedor #root')
}

// Nota: no usamos <StrictMode> a propósito. El doble montaje de React en
// desarrollo provocaría conectar/desconectar el room de LiveKit dos veces.
createRoot(container).render(<App />)
