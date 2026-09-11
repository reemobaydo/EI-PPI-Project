import { renderApp } from './src/components/App.js';
import { createPageTransition } from './src/utils/animations.js';

// Create a web API equivalent to the Electron API
if (typeof window.api === 'undefined') {
  window.api = {
    saveFile: async (options) => {
      const blob = new Blob([options.content], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = options.defaultPath || 'calculation.json';
      a.click();
      URL.revokeObjectURL(url);
      return options.defaultPath;
    },
    openFile: async (options) => {
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type   = 'file';
        input.accept = options.filters
          ? options.filters.map(f => f.extensions.map(ext => `.${ext}`).join(',')).join(',')
          : '';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload  = () => resolve({ filePath: file.name, content: reader.result });
          reader.onerror = reject;
          reader.readAsText(file);
        };
        input.click();
      });
    },
    onMenuSaveCalculation: (cb) => { /* … */ },
    onMenuLoadCalculation: (cb) => { /* … */ },
    onMenuExportPDF:    (cb) => { /* … */ },
    onMenuAbout:        () => {}
  };
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM fully loaded, initializing app...');
    // First render the app
    const appElement = document.getElementById('app');
    console.log('App element found:', appElement);
    renderApp(appElement);
    
    // Initialize icons
    if (window.feather) {
      console.log('Feather icons library found, initializing...');
      window.feather.replace();
    } else {
      console.warn('Feather icons library not found');
    }
  } catch (error) {
    console.error('Error initializing application:', error);
    // Display error on the page for debugging
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="color: red; padding: 20px; border: 1px solid #ddd; margin: 20px;">
          <h2>Application Error</h2>
          <p>${error.message}</p>
          <pre>${error.stack}</pre>
        </div>
      `;
    }
  }
});