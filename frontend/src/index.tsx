import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Import MUI ThemeProvider and your custom theme
import { ThemeProvider, CssBaseline } from '@mui/material';
// Fix the casing issue with the theme import
import web3Theme from './Utils/theme';

const rootElement = document.getElementById('root')
if (!rootElement) {
  // Development safeguard for missing root element
  const errorDiv = document.createElement('div')
  errorDiv.style.padding = '20px'
  errorDiv.style.color = '#721c24'
  errorDiv.style.backgroundColor = '#f8d7da'
  errorDiv.style.border = '1px solid #f5c6cb'
  errorDiv.style.borderRadius = '4px'
  errorDiv.style.margin = '20px'
  errorDiv.innerHTML = `
    <h1 style="color: #721c24; margin-top: 0;">⚠️ Missing Root Element</h1>
    <p>The root element with id="root" was not found in the DOM.</p>
    <p>Please check your index.html file to ensure it includes an element with id="root".</p>
  `
  document.body.appendChild(errorDiv)
  
  // Still throw an error to prevent the app from running in an invalid state
  throw new Error('Root element not found. Please check your index.html file for an element with id="root".')
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={web3Theme}>
      <CssBaseline /> {/* Ensures consistent baseline styles for dark mode */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);