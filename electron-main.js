const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Check if we are running in development mode through args or by directly passing URL 
  // (though in ng build, it spits out static files, so we usually load index.html)
  
  // The Angular 17+ application builder builds to 'browser' under the dist path.
  const appPath = path.join(__dirname, 'dist', 'apex', 'browser', 'index.html');
  
  // We can also allow a local dev server fallback if desired, but standard build outputs to disk
  if (process.argv.includes('--serve')) {
    // If serving locally via standard ng serve + concurrent electron
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else if (fs.existsSync(appPath)) {
    // Load the pre-built angular application from the dist folder
    mainWindow.loadURL(
      url.format({
        pathname: appPath,
        protocol: 'file:',
        slashes: true
      })
    );
  } else {
    // Fallback if built files are not found (legacy builder or wrong path)
    mainWindow.loadFile(path.join(__dirname, 'dist', 'apex', 'index.html'));
  }

  // Remove the default electron menu (File, Edit, etc) if you want a clean app feel
  // Menu.setApplicationMenu(null); 

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Ensure the app is ready before creating a window
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
