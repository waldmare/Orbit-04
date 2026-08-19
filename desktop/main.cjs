const { app, BrowserWindow, Menu, shell } = require('electron');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

async function waitForRenderer(win, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let state = null;
  do {
    state = await win.webContents.executeJavaScript(`({
      title: document.title,
      canvas: document.getElementById('game')?.dataset.engine || 'missing',
      renderer: document.getElementById('game')?.dataset.renderer || 'missing',
      visuals: document.getElementById('game')?.dataset.visualEngine || 'missing',
      audio: document.getElementById('game')?.dataset.audioEngine || 'missing',
      boot: document.body.dataset.orbitBoot || 'missing'
    })`);
    if (state.boot === 'ok') return state;
    await new Promise(resolve => setTimeout(resolve, 250));
  } while (Date.now() < deadline);
  return state;
}

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
    try {
        const state = await waitForRenderer(win);
        console.log(`[renderer-ready] ${JSON.stringify(state)}`);
        if (automatedMode && state.boot !== 'ok') {
          return app.exit(1);
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
            } finally { app.exit(process.exitCode || 0); }
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
            state.time=105;
            state.level=5;
            state.threat=2;
            state.chain=24;
            state.chainTimer=999;
            state.rush=8;
            state.spawnT=999;
            state.eliteT=999;
            state.nextBounty=999;
            state.nextAnomaly=999;
            state.nextSecret=999;
            const layout=[
              ['scout',false,210,145],['charger',false,755,165],
              ['tank',true,190,395],['gunner',false,770,390],
              ['splitter',false,390,105],['sniper',true,570,445]
            ];
            for(const [type,elite,x,y] of layout)spawnEnemy(type,elite,{x,y});
            updateDynamicBackground(performance.now(),4200);
            hideAll();
            hud.classList.remove('hidden');
            centerMessage.textContent='';
            draw();
            void document.body.offsetHeight;
            return {mode:state.mode,sector:state.sector.name,difficulty:state.difficulty,enemies:state.enemies.length,visibleScreens:screens.filter(id => $(id).classList.contains('show')),hudHidden:hud.classList.contains('hidden')};
          })()`);
          setTimeout(async () => {
            const screenshotPath = path.join(__dirname, '..', 'docs', 'runtime-screenshot.png');
            try {
              const gameplay = await win.webContents.executeJavaScript(`({mode:state?.mode,time:state?.time||0,enemies:state?.enemies?.length||0,renderer:document.getElementById('game')?.dataset.renderer||'missing',visibleScreens:screens.filter(id => $(id).classList.contains('show')),hudHidden:hud.classList.contains('hidden')})`);
              if (gameplay.mode !== 'run' || gameplay.time < 100 || gameplay.enemies < 6 || gameplay.visibleScreens.length || gameplay.hudHidden) throw new Error(`capture scene not ready: ${JSON.stringify(gameplay)}`);
              // BrowserWindow.capturePage keeps a hidden page paintable while the
              // capture is active; WebContents.capturePage can return its stale
              // pre-game compositor frame on Windows.
              await win.capturePage(undefined, { stayHidden: true });
              const image = await win.capturePage(undefined, { stayHidden: true });
              if (image.isEmpty()) throw new Error('captured image is empty');
              await mkdir(path.dirname(screenshotPath), { recursive: true });
              await writeFile(screenshotPath, image.toPNG());
              console.log(`[runtime-capture] ${JSON.stringify({...gameplay,path:screenshotPath,size:image.getSize()})}`);
            } catch (error) {
              console.error(`[runtime-capture] ${error.message}`);
              process.exitCode = 1;
            } finally { app.exit(process.exitCode || 0); }
          }, 1200);
        }
      } catch (error) {
        console.error(`[renderer-probe] ${error.message}`);
        if (automatedMode) app.exit(1);
      }
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
