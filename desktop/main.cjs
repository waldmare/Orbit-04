const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');

function createWindow() {
  const smokeMode = process.argv.includes('--orbit-smoke');
  const win = new BrowserWindow({
    width: 1440,
    height: 810,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#02050a',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);
  win.webContents.on('console-message', event => {
    const message = event?.message;
    if (message) console.log(`[renderer] ${message}`);
  });
  win.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`[renderer-load] ${code} ${description} ${url}`);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[renderer-gone] ${details.reason}`);
  });
  win.webContents.on('did-finish-load', async () => {
    setTimeout(async () => {
      try {
        const state = await win.webContents.executeJavaScript(`({
          title: document.title,
          canvas: document.getElementById('game')?.dataset.engine || 'missing',
          renderer: document.getElementById('game')?.dataset.renderer || 'missing',
          visuals: document.getElementById('game')?.dataset.visualEngine || 'missing',
          audio: document.getElementById('game')?.dataset.audioEngine || 'missing',
          boot: document.body.dataset.orbitBoot || 'missing'
        })`);
        console.log(`[renderer-ready] ${JSON.stringify(state)}`);
        if (smokeMode && state.boot === 'ok') {
          const setup = await win.webContents.executeJavaScript(`(() => {
            save.settings.audio='OFF'; save.settings.damageNumbers='ALL'; startRun();
            keys.d=true; const dashed=tryPhaseDash(); keys.d=false;
            const enemy=spawnEnemy('gunner',false,{x:state.p.x+120,y:state.p.y}); enemy.shootT=.1;
            damageEnemy(enemy,10,false,'smoke',false);
            return {dashed,floaters:state.floaters.length,dashCooldown:state.p.dashCooldown};
          })()`);
          setTimeout(async () => {
            try {
              const gameplay = await win.webContents.executeJavaScript(`({mode:state.mode,time:state.time,enemies:state.enemies.length,dashCooldown:state.p.dashCooldown,floaterPool:visualEngine?.floaters?.items?.length||0})`);
              console.log(`[gameplay-smoke] ${JSON.stringify({...setup,...gameplay})}`);
              if (!setup.dashed || setup.floaters < 1 || gameplay.mode !== 'run' || gameplay.time <= 0 || gameplay.enemies < 1 || gameplay.floaterPool < 1) process.exitCode = 1;
            } catch (error) {
              console.error(`[gameplay-smoke] ${error.message}`);process.exitCode = 1;
            } finally { app.quit(); }
          }, 900);
        }
      } catch (error) {
        console.error(`[renderer-probe] ${error.message}`);
      }
    }, 1400);
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) event.preventDefault();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
