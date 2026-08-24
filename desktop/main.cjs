const { app, BrowserWindow, Menu, session, shell } = require('electron');
const { appendFile, mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

const smokeMode = process.argv.includes('--orbit-smoke');
const runtimeCaptureMode = process.argv.includes('--orbit-capture');
const menuCaptureMode = process.argv.includes('--orbit-menu-capture');
const steamCaptureMode = process.argv.includes('--orbit-steam-capture');
const captureMode = runtimeCaptureMode || menuCaptureMode || steamCaptureMode;
const automatedMode = smokeMode || captureMode;
const entryFile = path.join(__dirname, '..', 'index.html');
const iconFile = path.join(__dirname, '..', 'assets', 'branding', 'orbit-app-icon.ico');
const STEAM_CAPTURE_PRESETS = [
  { slug: '01-deep-space-assault', time: 42, level: 3, threat: 2, chain: 12, boss: false },
  { slug: '02-pulsar-signal-rush', time: 126, level: 6, threat: 3, chain: 24, boss: false },
  { slug: '03-rift-crossfire', time: 232, level: 9, threat: 4, chain: 38, boss: false },
  { slug: '04-supernova-siege', time: 338, level: 12, threat: 5, chain: 51, boss: false },
  { slug: '05-carrier-boss-encounter', time: 486, level: 15, threat: 6, chain: 67, boss: true }
];

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function reportError(scope, error) {
  const message = error instanceof Error ? `${error.message}\n${error.stack || ''}` : String(error);
  console.error(`[${scope}] ${message}`);
  if (!app.isReady()) return;
  const directory = path.join(app.getPath('userData'), 'logs');
  const line = `${new Date().toISOString()} [${scope}] ${message}\n`;
  void mkdir(directory, { recursive: true })
    .then(() => appendFile(path.join(directory, 'orbit.log'), line, 'utf8'))
    .catch(logError => console.error(`[diagnostic-log] ${logError.message}`));
}

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
    await delay(250);
  } while (Date.now() < deadline);
  return state;
}

async function configureCaptureScene(win, preset) {
  return win.webContents.executeJavaScript(`(() => {
    const preset = ${JSON.stringify(preset)};
    save.settings.audio='OFF';
    save.settings.hints='OFF';
    save.settings.damageNumbers='ALL';
    save.settings.graphics='ULTRA';
    save.settings.background='FULL';
    save.settings.uiScale='XL';
    save.settings.motion='FULL';
    applyDisplaySettings();
    startRun();
    toastStack.innerHTML='';
    state.time=preset.time;
    state.level=preset.level;
    state.threat=preset.threat;
    state.chain=preset.chain;
    state.chainTimer=999;
    state.rush=preset.chain>=20?8:0;
    state.spawnT=999;
    state.eliteT=999;
    state.nextBounty=999;
    state.nextAnomaly=999;
    state.nextSecret=999;
    state.p.x=480;
    state.p.y=300;
    for(const weapon of ['missile','beam','drone']){
      if(!state.weapons[weapon])addWeapon(weapon);
      state.weapons[weapon].level=Math.min(6,Math.max(2,Math.floor(preset.level/3)));
    }
    const layout=[
      ['scout',false,205,145],['charger',false,755,165],
      ['tank',true,190,395],['gunner',false,770,390],
      ['splitter',false,380,105],['sniper',true,585,445],
      ['scout',false,285,70],['charger',false,690,475],
      ['gunner',false,865,275],['splitter',false,95,255]
    ];
    for(const [type,elite,x,y] of layout)spawnEnemy(type,elite,{x,y});
    if(preset.boss){
      spawnBoss(2);
      const boss=state.enemies.find(enemy=>enemy.boss);
      if(boss){boss.x=480;boss.y=105;boss.hp=boss.maxHp*.66;updateBossPhase(boss)}
    }
    state.rifts.push({x:675,y:280,r:74,life:2.5,maxLife:2.7,tick:0,damage:0,pull:0});
    state.arcs.push({x1:300,y1:300,x2:205,y2:145,life:1,color:'#69dfff'});
    const shooters=state.enemies.filter(enemy=>enemy.boss||enemy.type==='gunner'||enemy.type==='sniper').slice(0,preset.boss?4:3);
    for(const enemy of shooters)enemyShoot(enemy);
    state.enemyBullets.forEach((bullet,index)=>{const travel=.14+(index%6)*.09;bullet.x+=bullet.vx*travel;bullet.y+=bullet.vy*travel});
    for(const target of state.enemies.slice(0,6))fireProjectile(state.p.x,state.p.y,target,360,1,{r:3,life:2,color:'#9ffaff',weaponId:'capture'});
    state.bullets.forEach((bullet,index)=>{const travel=.12+(index%4)*.08;bullet.x+=bullet.vx*travel;bullet.y+=bullet.vy*travel});
    state.beams.push({x1:state.p.x,y1:state.p.y,x2:755,y2:165,life:.8,color:'#78caff'});
    particle(300,300,'#89eaff',20);
    particle(675,280,'#ad78ff',20);
    state.paused=true;
    updateDynamicBackground(performance.now(),99999);
    hideAll();
    hud.classList.remove('hidden');
    centerMessage.textContent='';
    draw();
    void document.body.offsetHeight;
    return {
      mode:state.mode,
      time:state.time,
      sector:state.sector.name,
      difficulty:state.difficulty,
      enemies:state.enemies.length,
      hostileProjectiles:state.enemyBullets.length,
      friendlyProjectiles:state.bullets.length,
      presentation:{
        engine:document.getElementById('game')?.dataset.engine,
        opacity:getComputedStyle(document.getElementById('gameThree')).opacity,
        zIndex:getComputedStyle(document.getElementById('gameThree')).zIndex,
        width:document.getElementById('gameThree').width,
        height:document.getElementById('gameThree').height,
        objects:visualEngine?.world?.children?.length||0,
        playerVisible:visualEngine?.player?.visible===true,
        playerPosition:visualEngine?.player?.position?.toArray?.()||[]
      },
      visibleScreens:screens.filter(id => $(id).classList.contains('show')),
      hudHidden:hud.classList.contains('hidden')
    };
  })()`);
}

async function captureScene(win, preset, destination, expectedSize) {
  const setup = await configureCaptureScene(win, preset);
  if (setup.mode !== 'run' || setup.enemies < 6 || setup.visibleScreens.length || setup.hudHidden) {
    throw new Error(`capture scene not ready: ${JSON.stringify(setup)}`);
  }
  await delay(700);
  // Keeping the hidden window paintable avoids a stale pre-game compositor frame on Windows.
  await win.capturePage(undefined, { stayHidden: true });
  const image = await win.capturePage(undefined, { stayHidden: true });
  const size = image.getSize();
  if (image.isEmpty()) throw new Error('captured image is empty');
  if (size.width !== expectedSize.width || size.height !== expectedSize.height) {
    throw new Error(`capture size ${size.width}x${size.height} does not match ${expectedSize.width}x${expectedSize.height}`);
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, image.toPNG());
  console.log(`[runtime-capture] ${JSON.stringify({ ...setup, path: destination, size })}`);
}

async function captureMenu(win) {
  const setup = await win.webContents.executeJavaScript(`(() => {
    save.settings.uiScale='XL';
    save.settings.motion='REDUCED';
    applyDisplaySettings();
    toMenu();
    renderMenu();
    void document.body.offsetHeight;
    return {
      version:GAME_VERSION,
      selected:save.selected,
      frames:Object.keys(SHIPS).length,
      visibleScreens:screens.filter(id => $(id).classList.contains('show')),
      horizontalOverflow:$('titleScreen').querySelector('.titlePanel').scrollWidth>$('titleScreen').querySelector('.titlePanel').clientWidth
    };
  })()`);
  if (setup.frames !== 10 || setup.visibleScreens.length !== 1 || setup.visibleScreens[0] !== 'titleScreen' || setup.horizontalOverflow) {
    throw new Error(`launch hangar not ready: ${JSON.stringify(setup)}`);
  }
  await delay(700);
  await win.capturePage(undefined, { stayHidden: true });
  const image = await win.capturePage(undefined, { stayHidden: true });
  const size = image.getSize();
  if (image.isEmpty() || size.width !== 1440 || size.height !== 810) throw new Error(`launch hangar capture invalid: ${JSON.stringify(size)}`);
  const output = path.join(__dirname, '..', 'docs', 'launch-hangar-v0.88.1.png');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image.toPNG());
  console.log(`[menu-capture] ${JSON.stringify({ ...setup, path: output, size })}`);
}

async function runAutomatedCapture(win) {
  if (menuCaptureMode) return captureMenu(win);
  if (steamCaptureMode) {
    const output = path.join(__dirname, '..', 'steam', 'store', 'screenshots');
    for (const preset of STEAM_CAPTURE_PRESETS) {
      await captureScene(win, preset, path.join(output, `${preset.slug}.png`), { width: 1920, height: 1080 });
    }
    return;
  }
  const preset = STEAM_CAPTURE_PRESETS[1];
  const output = path.join(__dirname, '..', 'docs', 'runtime-screenshot-v0.88.1.png');
  await captureScene(win, preset, output, { width: 1440, height: 810 });
}

function createWindow() {
  const captureSize = steamCaptureMode ? { width: 1920, height: 1080 } : { width: 1440, height: 810 };
  const win = new BrowserWindow({
    ...captureSize,
    useContentSize: captureMode,
    frame: !captureMode,
    show: !captureMode,
    minWidth: 960,
    minHeight: 540,
    title: 'ORBIT//04',
    icon: iconFile,
    backgroundColor: '#02050a',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      safeDialogs: true,
      spellcheck: false,
      devTools: !app.isPackaged && !automatedMode,
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
    reportError('renderer-load', `${code} ${description} ${url}`);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    reportError('renderer-gone', details.reason);
  });
  win.webContents.on('did-finish-load', async () => {
    try {
      const rendererState = await waitForRenderer(win);
      console.log(`[renderer-ready] ${JSON.stringify(rendererState)}`);
      if (automatedMode && rendererState.boot !== 'ok') return app.exit(1);
      if (smokeMode && rendererState.boot === 'ok') {
        const setup = await win.webContents.executeJavaScript(`(() => {
          save.settings.audio='OFF'; save.settings.damageNumbers='ALL'; startRun();
          keys.d=true; const dashed=tryPhaseDash();
          const enemy=spawnEnemy('scout',false,{x:state.p.x+220,y:state.p.y}); enemy.smokeProbe=true;
          damageEnemy(enemy,10,false,'smoke',false);
          enemy.hp=enemy.maxHp=1e6;
          draw();
          return {dashed,floaters:state.floaters.length,dashCooldown:state.p.dashCooldown,playerStart:{x:state.p.x,y:state.p.y},playerVisualStart:{x:visualEngine?.player?.position?.x||0,y:visualEngine?.player?.position?.y||0},enemyStart:{x:enemy.x,y:enemy.y}};
        })()`);
        await delay(900);
        const gameplay = await win.webContents.executeJavaScript(`(() => {keys.d=false;const enemy=state.enemies.find(item=>item.smokeProbe),active=state.enemies.filter(item=>!item.dead),enemyIndex=active.indexOf(enemy),enemyVisual=visualEngine?.pools?.enemies?.[enemyIndex]?.position;return {mode:state.mode,time:state.time,enemies:state.enemies.length,dashCooldown:state.p.dashCooldown,floaterPool:visualEngine?.pools?.floaters?.length||0,player:{x:state.p.x,y:state.p.y},playerVisual:{x:visualEngine?.player?.position?.x||0,y:visualEngine?.player?.position?.y||0},enemy:{x:enemy?.x||0,y:enemy?.y||0},enemyVisual:{x:enemyVisual?.x||0,y:enemyVisual?.y||0}}})()`);
        console.log(`[gameplay-smoke] ${JSON.stringify({ ...setup, ...gameplay })}`);
        const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
        if (!setup.dashed || setup.floaters < 1 || gameplay.mode !== 'run' || gameplay.time <= 0 || gameplay.enemies < 1 || gameplay.floaterPool < 1 || distance(gameplay.player,setup.playerStart)<40 || distance(gameplay.playerVisual,setup.playerVisualStart)<30 || distance(gameplay.enemy,setup.enemyStart)<5 || distance(gameplay.enemyVisual,setup.enemyStart)<3 || distance(gameplay.enemyVisual,gameplay.enemy)>30) process.exitCode = 1;
        return app.exit(process.exitCode || 0);
      }
      if (captureMode && rendererState.boot === 'ok') {
        await runAutomatedCapture(win);
        return app.exit(0);
      }
    } catch (error) {
      reportError('renderer-probe', error);
      if (automatedMode) app.exit(1);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url) && !automatedMode) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) event.preventDefault();
  });
  void win.loadFile(entryFile);
  return win;
}

if (process.platform === 'win32') app.setAppUserModelId('com.waldmare.orbit04');

let ownsSingleInstance = true;
if (!automatedMode) {
  ownsSingleInstance = app.requestSingleInstanceLock();
  if (!ownsSingleInstance) app.quit();
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
}

app.on('web-contents-created', (_event, contents) => {
  contents.session.setPermissionCheckHandler(() => false);
  contents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  contents.on('will-attach-webview', event => event.preventDefault());
});
app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault();
  callback(false);
});
process.on('unhandledRejection', error => reportError('main-unhandled-rejection', error));

if (ownsSingleInstance) {
  app.whenReady().then(() => {
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
