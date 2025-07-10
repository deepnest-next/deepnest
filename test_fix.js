// Test script to verify the exact-fit boundary condition fix
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Mock electron app for testing
process.env.NODE_ENV = 'test';

function createTestWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the main HTML file
  win.loadFile('main/index.html');
  
  // Log test results
  win.webContents.on('did-finish-load', () => {
    console.log('Test window loaded successfully');
    
    // Test the exact-fit case
    win.webContents.executeJavaScript(`
      // Mock test for exact-fit scenario
      console.log('Testing exact-fit scenario...');
      
      // Create 1000x1000 sheet
      const sheet = [
        { x: 0, y: 0 },
        { x: 1000, y: 0 },
        { x: 1000, y: 1000 },
        { x: 0, y: 1000 }
      ];
      
      // Create 1000x1000 part
      const part = [
        { x: 0, y: 0 },
        { x: 1000, y: 0 },
        { x: 1000, y: 1000 },
        { x: 0, y: 1000 }
      ];
      
      // Test NFP calculation
      if (typeof GeometryUtil !== 'undefined') {
        const nfp = GeometryUtil.noFitPolygonRectangle(sheet, part);
        console.log('NFP result:', nfp);
        
        if (nfp && nfp.length > 0) {
          console.log('SUCCESS: NFP generated for exact-fit case');
        } else {
          console.log('ERROR: No NFP generated for exact-fit case');
        }
      } else {
        console.log('ERROR: GeometryUtil not available');
      }
    `).then(() => {
      console.log('Test completed');
      setTimeout(() => {
        app.quit();
      }, 1000);
    });
  });

  return win;
}

app.whenReady().then(() => {
  createTestWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createTestWindow();
  }
});