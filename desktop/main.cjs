const { app, BrowserWindow, Menu, shell } = require('electron');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

function createWindow() {
  const smokeMode = process.argv.includes('--orbit-smoke');
  const captureMode = process.argv.includes('--orbit-capture');
  const automatedMode = smokeMode || captureMode;
  const win = new BrowserWindow({
    width: 1440,
    height: 810,
    useContentSize: captureMode,
    frame: !captureMode,
    show: !captureMode,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#02050a',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      ...(captureMode ? { partition: 'orbit04-capture' } : {})
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
        if (automatedMode && state.boot !== 'ok') {
          process.exitCode = 1;
          return app.quit();
        }
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
        if (captureMode && state.boot === 'ok') {
          await win.webContents.executeJavaScript(`(() => {
            save.settings.audio='OFF';
            save.settings.hints='OFF';
            save.settings.damageNumbers='ALL';
            save.settings.graphics='ULTRA';
            save.settings.background='FULL';
            save.settings.uiScale='XL';
            applyDisplaySettings();
            startRun();
            return {mode:state.mode,sector:state.sector.name,difficulty:state.difficulty};
          })()`);
          setTimeout(async () => {
            const screenshotPath = path.join(__dirname, '..', 'docs', 'runtime-screenshot.png');
            try {
              const gameplay = await win.webContents.executeJavaScript(`({mode:state?.mode,time:state?.time||0,enemies:state?.enemies?.length||0,renderer:document.getElementById('game')?.dataset.renderer||'missing'})`);
              if (gameplay.mode !== 'run' || gameplay.time < 4 || gameplay.enemies < 1) throw new Error(`capture scene not ready: ${JSON.stringify(gameplay)}`);
              const image = await win.webContents.capturePage();
              if (image.isEmpty()) throw new Error('captured image is empty');
              await mkdir(path.dirname(screenshotPath), { recursive: true });
              await writeFile(screenshotPath, image.toPNG());
              console.log(`[runtime-capture] ${JSON.stringify({...gameplay,path:screenshotPath,size:image.getSize()})}`);
            } catch (error) {
              console.error(`[runtime-capture] ${error.message}`);
              process.exitCode = 1;
            } finally { app.quit(); }
          }, 6500);
        }
      } catch (error) {
        console.error(`[renderer-probe] ${error.message}`);
        if (automatedMode) { process.exitCode = 1; app.quit(); }
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
