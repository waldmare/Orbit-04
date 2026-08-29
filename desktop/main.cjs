const { app, BrowserWindow, Menu, session, shell, dialog } = require('electron');
const { appendFile, mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

// ORBIT//04 is a local desktop game, so its licensed soundtrack may start as
// soon as a run begins instead of inheriting browser autoplay restrictions.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const smokeMode = process.argv.includes('--orbit-smoke');
const audioSmokeMode = process.argv.includes('--orbit-audio-smoke');
const runtimeCaptureMode = process.argv.includes('--orbit-capture');
const menuCaptureMode = process.argv.includes('--orbit-menu-capture');
const briefingCaptureMode = process.argv.includes('--orbit-briefing-capture');
const levelCaptureMode = process.argv.includes('--orbit-level-capture');
const settingsCaptureMode = process.argv.includes('--orbit-settings-capture');
const steamCaptureMode = process.argv.includes('--orbit-steam-capture');
const layoutSmokeMode = process.argv.includes('--orbit-layout-smoke');
const captureMode = runtimeCaptureMode || menuCaptureMode || briefingCaptureMode || levelCaptureMode || settingsCaptureMode || steamCaptureMode;
const automatedMode = smokeMode || audioSmokeMode || layoutSmokeMode || captureMode;
const windowedMode = process.argv.includes('--windowed');
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

// Packaged Windows GUI applications do not own a durable console when opened
// from Explorer. A renderer log written to that detached pipe can otherwise
// terminate the main process with EPIPE before the game reaches the menu.
for (const stream of [process.stdout, process.stderr]) {
  stream?.on?.('error', error => {
    if (error?.code !== 'EPIPE') process.exitCode = process.exitCode || 1;
  });
}
const consoleAvailable = !app.isPackaged || automatedMode;
function safeConsole(method, message) {
  if (!consoleAvailable) return;
  try { console[method](message); } catch (_error) {}
}

function reportError(scope, error) {
  const message = error instanceof Error ? `${error.message}\n${error.stack || ''}` : String(error);
  safeConsole('error', `[${scope}] ${message}`);
  if (!app.isReady()) return;
  const directory = path.join(app.getPath('userData'), 'logs');
  const line = `${new Date().toISOString()} [${scope}] ${message}\n`;
  void mkdir(directory, { recursive: true })
    .then(() => appendFile(path.join(directory, 'orbit.log'), line, 'utf8'))
    .catch(logError => safeConsole('error', `[diagnostic-log] ${logError.message}`));
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
    save.settings.effectClarity='HIGH';
    applyDisplaySettings();
    save.briefingSeen=true;
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
      ['stalker',false,285,70],['weaver',false,690,475],
      ['warden',false,865,275],['splitter',false,95,255],
      ['moth',false,420,465],['anchor',false,885,465],
      ['scout',false,125,90],['charger',false,845,90]
    ];
    for(const [type,elite,x,y] of layout)spawnEnemy(type,elite,{x,y});
    const captureSignals=[['repair',305,355],['fracture',655,365],['jammer',840,205]];
    for(const [index,[type,x,y]] of captureSignals.entries()){const meta=WORLD_NODE_TYPES[type];state.worldNodes.push({id:'capture:'+type,type,wx:state.worldX+x,wy:state.worldY+y,x,y,r:16,color:meta.color,disposition:meta.disposition,collected:false,active:true,pulse:index*.8})}
    if(preset.boss){
      spawnBoss(2);
      const boss=state.enemies.find(enemy=>enemy.boss);
      if(boss){boss.x=480;boss.y=105;boss.hp=boss.maxHp*.66;updateBossPhase(boss)}
    }
    state.rifts.push({x:675,y:280,r:74,life:2.5,maxLife:2.7,tick:0,damage:0,pull:0});
    state.arcs.push({x1:300,y1:300,x2:205,y2:145,life:1,color:'#69dfff'});
    const shooters=state.enemies.filter(enemy=>enemy.boss||enemy.type==='gunner'||enemy.type==='sniper'||enemy.type==='weaver').slice(0,preset.boss?4:3);
    for(const enemy of shooters)enemyShoot(enemy);
    state.enemyBullets.forEach((bullet,index)=>{const travel=.14+(index%6)*.09;bullet.x+=bullet.vx*travel;bullet.y+=bullet.vy*travel});
    for(const target of state.enemies.slice(0,6))fireProjectile(state.p.x,state.p.y,target,360,1,{r:3,life:2,color:'#9ffaff',weaponId:'capture'});
    state.bullets.forEach((bullet,index)=>{const travel=.12+(index%4)*.08;bullet.x+=bullet.vx*travel;bullet.y+=bullet.vy*travel;bullet.life-=travel});
    const impactTarget=state.enemies[1];if(impactTarget){emitImpactFx(impactTarget.x,impactTarget.y,-260,80,'missile','#ffd27a',true,24);state.impactFx.at(-1).life=state.impactFx.at(-1).maxLife*.58}
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
        clientWidth:document.getElementById('gameThree').clientWidth,
        clientHeight:document.getElementById('gameThree').clientHeight,
        renderWidth:Number(document.getElementById('gameThree').dataset.renderWidth||0),
        renderHeight:Number(document.getElementById('gameThree').dataset.renderHeight||0),
        pixelRatio:Number(document.getElementById('gameThree').dataset.pixelRatio||0),
        objects:visualEngine?.world?.children?.length||0,
        playerVisible:visualEngine?.player?.visible===true,
        playerPosition:visualEngine?.player?.position?.toArray?.()||[],
        pickupKinds:[...new Set((visualEngine?.pools?.loot||[]).filter(item=>item.visible).map(item=>item.userData?.pickupKind).filter(Boolean))]
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
  if (setup.presentation.renderWidth < expectedSize.width || setup.presentation.renderHeight < expectedSize.height) {
    throw new Error(`presentation buffer is below capture resolution: ${JSON.stringify(setup.presentation)}`);
  }
  if (!['repair','fracture','jammer'].every(kind => setup.presentation.pickupKinds.includes(kind))) {
    throw new Error(`capture does not expose semantic pickup icons: ${JSON.stringify(setup.presentation.pickupKinds)}`);
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
  safeConsole('log', `[runtime-capture] ${JSON.stringify({ ...setup, path: destination, size })}`);
}

async function captureMenu(win) {
  const setup = await win.webContents.executeJavaScript(`(() => {
    save.settings.uiScale='XL';
    save.settings.motion='REDUCED';
    applyDisplaySettings();
    toMenu();
    renderMenu();
    void document.body.offsetHeight;
    const infoText=[...document.querySelectorAll('#titleScreen .shipCardBadge,#titleScreen .shipCardRole,#titleScreen .shipCardStatus,#titleScreen .releaseMetrics span,#titleScreen .optionDetail,#titleScreen .frameLoadout small,#titleScreen .launchSummary span,#titleScreen .launchSummary i,#titleScreen .recommendedSetupBtn')].filter(node=>node.getBoundingClientRect().width>0&&node.getBoundingClientRect().height>0);
    return {
      version:GAME_VERSION,
      selected:save.selected,
      frames:Object.keys(SHIPS).length,
      contentMetrics:document.querySelectorAll('.releaseMetrics > div').length,
      ownershipPromise:document.querySelector('.releaseOverviewHeading p')?.textContent||'',
      visibleScreens:screens.filter(id => $(id).classList.contains('show')),
      panelClientHeight:$('titleScreen').querySelector('.titlePanel').clientHeight,
      panelScrollHeight:$('titleScreen').querySelector('.titlePanel').scrollHeight,
      infoTextCount:infoText.length,
      minimumInfoFont:Math.min(...infoText.map(node=>parseFloat(getComputedStyle(node).fontSize))),
      horizontalOverflow:$('titleScreen').querySelector('.titlePanel').scrollWidth>$('titleScreen').querySelector('.titlePanel').clientWidth,
      verticalOverflow:$('titleScreen').querySelector('.titlePanel').scrollHeight>$('titleScreen').querySelector('.titlePanel').clientHeight
    };
  })()`);
  if (setup.frames !== 10 || setup.contentMetrics !== 5 || !setup.ownershipPromise.includes('NO MICROTRANSACTIONS') || setup.visibleScreens.length !== 1 || setup.visibleScreens[0] !== 'titleScreen' || setup.infoTextCount < 30 || setup.minimumInfoFont < 8.6 || setup.horizontalOverflow || setup.verticalOverflow) {
    throw new Error(`launch hangar not ready: ${JSON.stringify(setup)}`);
  }
  await win.capturePage(undefined, { stayHidden: true });
  await delay(700);
  const image = await win.capturePage(undefined, { stayHidden: true });
  const size = image.getSize();
  if (image.isEmpty() || size.width !== 1440 || size.height !== 810) throw new Error(`launch hangar capture invalid: ${JSON.stringify(size)}`);
  const output = path.join(__dirname, '..', 'docs', 'launch-hangar-v0.92.0.png');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image.toPNG());
  safeConsole('log', `[menu-capture] ${JSON.stringify({ ...setup, path: output, size })}`);
}

async function captureLevel(win) {
  const setup = await win.webContents.executeJavaScript(`(() => {
    save.settings.audio='OFF';
    save.settings.uiScale='XL';
    save.settings.motion='REDUCED';
    applyDisplaySettings();
    save.briefingSeen=true;
    startRun();
    state.level=2;
    state.rerolls=2;
    openLevel();
    const originalRandom=Math.random;
    Math.random=()=>.01;
    document.getElementById('signalDrawBtn').click();
    Math.random=originalRandom;
    void document.body.offsetHeight;
    const panel=document.querySelector('#levelScreen .panel');
    return {
      level:state.level,
      rerolls:state.rerolls,
      offers:state.currentOffers.map(offer=>({name:offer.name,lvl:offer.lvl,signal:offer.signalTier||''})),
      visibleScreens:screens.filter(id=>$(id).classList.contains('show')),
      horizontalOverflow:panel.scrollWidth>panel.clientWidth,
      verticalOverflow:panel.scrollHeight>panel.clientHeight
    };
  })()`);
  if (setup.visibleScreens.length !== 1 || setup.visibleScreens[0] !== 'levelScreen' || setup.horizontalOverflow || setup.verticalOverflow || !setup.offers.some(offer => offer.signal === 'RESONANT')) {
    throw new Error(`level-up capture not ready: ${JSON.stringify(setup)}`);
  }
  await delay(700);
  await win.capturePage(undefined, { stayHidden: true });
  const image = await win.capturePage(undefined, { stayHidden: true });
  const size = image.getSize();
  if (image.isEmpty() || size.width !== 1440 || size.height !== 810) throw new Error(`level-up capture invalid: ${JSON.stringify(size)}`);
  const output = path.join(__dirname, '..', 'docs', 'level-up-v0.92.0.png');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image.toPNG());
  safeConsole('log', `[level-capture] ${JSON.stringify({ ...setup, path: output, size })}`);
}

async function captureBriefing(win) {
  const setup = await win.webContents.executeJavaScript(`(() => {
    save.settings.audio='OFF';
    save.settings.uiScale='XL';
    save.settings.motion='REDUCED';
    save.briefingSeen=false;
    applyDisplaySettings();
    startRun();
    openPilotBriefing();
    void document.body.offsetHeight;
    const panel=document.querySelector('#briefingScreen .briefingPanel');
    return {
      paused:state.paused,
      steps:document.querySelectorAll('#briefingScreen .briefingSteps article').length,
      controls:document.querySelectorAll('#briefingScreen .briefingControls > span').length,
      visibleScreens:screens.filter(id=>$(id).classList.contains('show')),
      horizontalOverflow:panel.scrollWidth>panel.clientWidth,
      verticalOverflow:panel.scrollHeight>panel.clientHeight
    };
  })()`);
  if (!setup.paused || setup.steps !== 3 || setup.controls !== 4 || setup.visibleScreens.length !== 1 || setup.visibleScreens[0] !== 'briefingScreen' || setup.horizontalOverflow || setup.verticalOverflow) {
    throw new Error(`pilot briefing capture not ready: ${JSON.stringify(setup)}`);
  }
  await delay(700);
  await win.capturePage(undefined, { stayHidden: true });
  const image = await win.capturePage(undefined, { stayHidden: true });
  const size = image.getSize();
  if (image.isEmpty() || size.width !== 1440 || size.height !== 810) throw new Error(`pilot briefing capture invalid: ${JSON.stringify(size)}`);
  const output = path.join(__dirname, '..', 'docs', 'pilot-briefing-v0.92.0.png');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image.toPNG());
  safeConsole('log', `[briefing-capture] ${JSON.stringify({ ...setup, path: output, size })}`);
}

async function captureSettings(win) {
  const setup = await win.webContents.executeJavaScript(`(() => {
    save.settings.uiScale='L';
    save.settings.motion='REDUCED';
    applyDisplaySettings();
    hideAll();
    renderSettings();
    show('settingsScreen');
    const panel=document.querySelector('#settingsScreen .settingsPanel');
    panel.scrollTop=panel.scrollHeight;
    void document.body.offsetHeight;
    const slider=$('sfxVolumeSlider').getBoundingClientRect(),panelRect=panel.getBoundingClientRect();
    return {
      rows:document.querySelectorAll('#settingsScreen .settingRow').length,
      volumeSliders:document.querySelectorAll('#settingsScreen input[type="range"]').length,
      volumeStep:$('sfxVolumeSlider').step,
      volumeVisible:slider.top>=panelRect.top&&slider.bottom<=panelRect.bottom,
      visibleScreens:screens.filter(id=>$(id).classList.contains('show')),
      horizontalOverflow:panel.scrollWidth>panel.clientWidth,
      presetButtons:document.querySelectorAll('#settingsScreen .presetButtons button').length,
      dataButtons:document.querySelectorAll('#settingsScreen .dataActions button').length
    };
  })()`);
  if (setup.rows < 20 || setup.volumeSliders !== 2 || setup.volumeStep !== '5' || !setup.volumeVisible || setup.presetButtons !== 4 || setup.dataButtons !== 4 || setup.visibleScreens.length !== 1 || setup.visibleScreens[0] !== 'settingsScreen' || setup.horizontalOverflow) {
    throw new Error(`settings capture not ready: ${JSON.stringify(setup)}`);
  }
  await delay(700);
  await win.capturePage(undefined, { stayHidden: true });
  const image = await win.capturePage(undefined, { stayHidden: true });
  const size = image.getSize();
  if (image.isEmpty() || size.width !== 1440 || size.height !== 810) throw new Error(`settings capture invalid: ${JSON.stringify(size)}`);
  const output = path.join(__dirname, '..', 'docs', 'settings-v0.92.0.png');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image.toPNG());
  safeConsole('log', `[settings-capture] ${JSON.stringify({ ...setup, path: output, size })}`);
}

async function runAutomatedCapture(win) {
  if (menuCaptureMode) return captureMenu(win);
  if (briefingCaptureMode) return captureBriefing(win);
  if (levelCaptureMode) return captureLevel(win);
  if (settingsCaptureMode) return captureSettings(win);
  if (steamCaptureMode) {
    const output = path.join(__dirname, '..', 'steam', 'store', 'screenshots');
    for (const preset of STEAM_CAPTURE_PRESETS) {
      await captureScene(win, preset, path.join(output, `${preset.slug}.png`), { width: 1920, height: 1080 });
    }
    return;
  }
  const preset = STEAM_CAPTURE_PRESETS[1];
  const output = path.join(__dirname, '..', 'docs', 'runtime-screenshot-v0.92.0.png');
  await captureScene(win, preset, output, { width: 1440, height: 810 });
}

async function runLayoutSmoke(win) {
  const sizes = [{ width: 960, height: 540 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }];
  const report = [];
  for (const size of sizes) {
    win.setBounds({ x: 0, y: 0, width: size.width, height: size.height }, false);
    await delay(260);
    const result = await win.webContents.executeJavaScript(`(() => {
      save.settings.audio='OFF';save.settings.uiScale='XL';save.settings.motion='REDUCED';save.briefingSeen=true;applyDisplaySettings();
      const inspect=(id,allowVertical=true)=>{const overlay=$(id),panel=overlay.querySelector('.panel'),wrapRect=$('wrap').getBoundingClientRect(),rect=panel.getBoundingClientRect(),buttons=[...panel.querySelectorAll('button:not(.hidden)')].filter(button=>!button.disabled),buttonRects=buttons.map(button=>button.getBoundingClientRect()),horizontalOverflow=panel.scrollWidth>panel.clientWidth+1,verticalOverflow=panel.scrollHeight>panel.clientHeight+1,withinViewport=rect.left>=wrapRect.left-1&&rect.right<=wrapRect.right+1&&rect.top>=wrapRect.top-1&&rect.bottom<=wrapRect.bottom+1,usableButtons=buttonRects.every(button=>button.width>=21.5&&button.height>=21.5),minimumButton=buttonRects.length?{width:Math.round(Math.min(...buttonRects.map(button=>button.width))),height:Math.round(Math.min(...buttonRects.map(button=>button.height)))}:null,smallButtons=buttonRects.map((button,index)=>({id:buttons[index].id||buttons[index].className,width:Math.round(button.width),height:Math.round(button.height)})).filter(button=>button.width<22||button.height<22);return{id,horizontalOverflow,verticalOverflow,allowVertical,withinViewport,usableButtons,minimumButton,smallButtons,buttonCount:buttons.length,client:{width:panel.clientWidth,height:panel.clientHeight},scroll:{width:panel.scrollWidth,height:panel.scrollHeight}}};
      const screens=[];
      toMenu();renderMenu();screens.push(inspect('titleScreen',true));
      startRun();pause(true);screens.push(inspect('pauseScreen',true));
      openRunConfirmation('abort');const confirmation=inspect('confirmScreen',false);confirmation.safeDefault=document.activeElement===$('confirmCancelBtn');screens.push(confirmation);closeRunConfirmation(false);
      startRun();state.level=5;openLevel();screens.push(inspect('levelScreen',true));
      startRun();state.time=438;state.level=12;state.kills=731;state.score=68420;state.runCredits=93;state.damageDealt=98124;state.chainBest=42;finishRun(false);screens.push(inspect('gameOverScreen',true));
      const visible=screens.filter(item=>!item.withinViewport||item.horizontalOverflow||!item.usableButtons||item.safeDefault===false||(!item.allowVertical&&item.verticalOverflow));
      return{viewport:{width:innerWidth,height:innerHeight},screens,failures:visible};
    })()`);
    report.push(result);
  }
  safeConsole('log', `[layout-smoke] ${JSON.stringify(report)}`);
  if (report.some(entry => entry.viewport.width < 960 || entry.viewport.height < 540 || entry.failures.length)) {
    throw new Error(`responsive layout QA failed: ${JSON.stringify(report)}`);
  }
  return report;
}

function createWindow() {
  const captureSize = steamCaptureMode ? { width: 1920, height: 1080 } : { width: 1440, height: 810 };
  const launchFullscreen = !automatedMode && !windowedMode;
  const win = new BrowserWindow({
    ...captureSize,
    useContentSize: captureMode || layoutSmokeMode,
    frame: false,
    fullscreen: launchFullscreen,
    fullscreenable: true,
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
      ...(captureMode ? { partition: 'orbit04-capture' } : layoutSmokeMode ? { partition: 'orbit04-layout-qa' } : {})
    }
  });

  Menu.setApplicationMenu(null);
  win.setMenuBarVisibility(false);
  let closeApproved = automatedMode;
  let closeCheckPending = false;
  win.on('close', event => {
    if (closeApproved || automatedMode) return;
    event.preventDefault();
    if (closeCheckPending) return;
    closeCheckPending = true;
    void (async () => {
      let exitState = { active: false, time: 0, credits: 0, frame: 'NONE' };
      try { exitState = await win.webContents.executeJavaScript(`typeof desktopExitState === 'function' ? desktopExitState() : ({ active: false })`); }
      catch (error) { reportError('exit-state', error); }
      if (exitState.active) {
        const minutes = Math.floor((exitState.time || 0) / 60);
        const seconds = Math.floor((exitState.time || 0) % 60).toString().padStart(2, '0');
        const result = await dialog.showMessageBox(win, {
          type: 'warning',
          title: 'Exit ORBIT//04',
          message: 'Bank this run and exit to desktop?',
          detail: `${exitState.frame} · ${minutes}:${seconds} transmission · ${Math.floor(exitState.credits || 0)} run credits\nThe run will count as aborted, but earned progress will be preserved.`,
          buttons: ['BANK RUN & EXIT', 'KEEP PLAYING'],
          defaultId: 1,
          cancelId: 1,
          noLink: true
        });
        if (result.response !== 0) { win.focus(); return; }
      }
      try { await win.webContents.executeJavaScript(`typeof prepareDesktopExit === 'function' ? prepareDesktopExit() : true`); }
      catch (error) { reportError('exit-save', error); }
      closeApproved = true;
      win.close();
    })().catch(error => {
      reportError('exit-flow', error);
      closeApproved = true;
      win.close();
    }).finally(() => { closeCheckPending = false; });
  });
  const toggleWindowMode = () => {
    const fullscreen = !win.isFullScreen();
    win.setFullScreen(fullscreen);
    if (!fullscreen) {
      win.setSize(1440, 810);
      win.center();
    }
  };
  win.webContents.on('before-input-event', (event, input) => {
    const key = String(input.key || '').toLowerCase();
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    if (key === 'f11' || (key === 'f' && !input.control && !input.meta && !input.shift) || (key === 'enter' && input.alt)) {
      event.preventDefault();
      toggleWindowMode();
    }
  });
  win.webContents.on('console-message', event => {
    const message = event?.message;
    if (message) safeConsole('log', `[renderer] ${message}`);
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
      safeConsole('log', `[renderer-ready] ${JSON.stringify(rendererState)}`);
      if (automatedMode && rendererState.boot !== 'ok') return app.exit(1);
      if (layoutSmokeMode && rendererState.boot === 'ok') {
        await runLayoutSmoke(win);
        return app.exit(0);
      }
      if (audioSmokeMode && rendererState.boot === 'ok') {
        await win.webContents.executeJavaScript(`(() => {save.briefingSeen=true;save.settings.audio='ON';save.settings.audioMix='BALANCED';save.settings.sfxVolume='100%';save.settings.musicVolume='100%';AUDIO.syncEnabled();startRun();AUDIO.testOutput();AUDIO.sfx('enemyShot',0,{x:state.p.x+320,y:state.p.y});return true})()`);
        await delay(2300);
        const audio = await win.webContents.executeJavaScript(`AUDIO.status()`);
        safeConsole('log', `[audio-smoke] ${JSON.stringify(audio)}`);
        if (!audio.enabled || audio.locked || audio.muted || audio.managerVolume < .9 || audio.sampleContext !== 'running' || audio.musicPlaying < 1 || !audio.ambiencePlaying || audio.mix !== 'STUDIO' || !audio.library.startsWith('CURATED CC0') || audio.spatialVoices < 1 || !audio.confirmed || audio.attempts < 5) process.exitCode = 1;
        return app.exit(process.exitCode || 0);
      }
      if (smokeMode && rendererState.boot === 'ok') {
        const setup = await win.webContents.executeJavaScript(`(() => {
          save.briefingSeen=true; save.settings.audio='OFF'; save.settings.damageNumbers='ALL'; save.settings.motion='FULL'; save.settings.effectClarity='HIGH'; startRun();
          keys.d=true; const dashed=tryPhaseDash();
          const enemy=spawnEnemy('scout',false,{x:state.p.x+220,y:state.p.y}); enemy.smokeProbe=true;
          damageEnemy(enemy,10,false,'smoke',false);
          enemy.hp=enemy.maxHp=1e6;
          for(const [index,type] of ['charger','tank','gunner','splitter','sniper','stalker','weaver','warden','moth','anchor'].entries()){const roleProbe=spawnEnemy(type,false,{x:125+(index%5)*185,y:index<5?155:390});roleProbe.hp=roleProbe.maxHp=1e6;roleProbe.roleProbe=true}
          state.enemyBullets.push({x:75,y:360,r:4,life:99,damage:0,grazed:false,vx:0,vy:0});
          state.orbs.push({x:70,y:455,r:3,val:1,dead:false});
          state.caches.push({x:120,y:455,r:8,rarity:'RARE',life:99,dead:false});
          for(const [index,type] of ['repair','flux','salvage','fracture','relic','jammer'].entries()){const meta=WORLD_NODE_TYPES[type],x=120+index*125,y=110;state.worldNodes.push({id:'smoke:'+type,type,wx:state.worldX+x,wy:state.worldY+y,x,y,r:16,color:meta.color,disposition:meta.disposition,collected:false,active:true,pulse:index*.4})}
          draw();
          const layer=document.getElementById('gameThree');return {dashed,floaters:state.floaters.length,dashCooldown:state.p.dashCooldown,playerStart:{x:state.p.x,y:state.p.y},playerVisualStart:{x:visualEngine?.player?.position?.x||0,y:visualEngine?.player?.position?.y||0},enemyStart:{x:enemy.x,y:enemy.y},presentation:{clientWidth:layer?.clientWidth||0,clientHeight:layer?.clientHeight||0,renderWidth:Number(layer?.dataset.renderWidth||0),renderHeight:Number(layer?.dataset.renderHeight||0)}};
        })()`);
        await delay(900);
        const gameplay = await win.webContents.executeJavaScript(`(() => {keys.d=false;const enemy=state.enemies.find(item=>item.smokeProbe),active=state.enemies.filter(item=>!item.dead),enemyIndex=active.indexOf(enemy),enemySprite=visualEngine?.pools?.enemies?.[enemyIndex],enemyVisual=enemySprite?.position,pickupKinds=[...new Set((visualEngine?.pools?.loot||[]).filter(item=>item.visible).map(item=>item.userData?.pickupKind).filter(Boolean))],enemyRoles=[...new Set((visualEngine?.pools?.enemyMarkers||[]).filter(item=>item.visible).map(item=>item.userData?.enemyRole).filter(Boolean))];return {mode:state.mode,time:state.time,enemies:state.enemies.length,dashCooldown:state.p.dashCooldown,floaterPool:visualEngine?.pools?.floaters?.length||0,player:{x:state.p.x,y:state.p.y},playerVisual:{x:visualEngine?.player?.position?.x||0,y:visualEngine?.player?.position?.y||0},playerHeading:visualEngine?.playerMotion?.angle??99,playerBank:visualEngine?.playerMotion?.bank??0,playerStrafe:visualEngine?.playerMotion?.strafe??0,playerRimOpacity:visualEngine?.playerRim?.material?.opacity||0,playerCoreOpacity:visualEngine?.playerCore?.material?.opacity||0,attitudeThrusters:[visualEngine?.playerAttitudeLeft,visualEngine?.playerAttitudeRight].filter(item=>item?.visible).length,leftEngineLength:visualEngine?.playerEngineLeft?.scale?.x||0,rightEngineLength:visualEngine?.playerEngineRight?.scale?.x||0,enemy:{x:enemy?.x||0,y:enemy?.y||0},enemyVisual:{x:enemyVisual?.x||0,y:enemyVisual?.y||0},enemyHeading:enemySprite?.userData?.motion?.angle??99,pickupKinds,enemyRoles,enemyRingCount:(visualEngine?.pools?.enemyRings||[]).filter(item=>item.visible).length,enemyWakeCount:(visualEngine?.pools?.enemyWakes||[]).filter(item=>item.visible).length,hostileOutlineCount:(visualEngine?.pools?.hostileBulletOutlines||[]).filter(item=>item.visible).length}})()`);
        await win.webContents.executeJavaScript(`keys.w=true`);await delay(360);
        const forwardMotion=await win.webContents.executeJavaScript(`(() => {keys.w=false;return {surge:visualEngine?.playerMotion?.surge??0,hullHeight:visualEngine?.player?.scale?.y||0,hullWidth:visualEngine?.player?.scale?.x||0,trailLength:visualEngine?.playerTrail?.scale?.x||0}})()`);
        const resumeQueued=await win.webContents.executeJavaScript(`(() => {pause(true);const requested=resumeRun();return {requested,paused:state.paused,countdown:state.resumeCountdown===true,buttonDisabled:document.getElementById('resumeBtn').disabled}})()`);
        await delay(1400);
        const resumeFinished=await win.webContents.executeJavaScript(`({paused:state.paused,countdown:state.resumeCountdown===true,pauseVisible:document.getElementById('pauseScreen').classList.contains('show'),buttonDisabled:document.getElementById('resumeBtn').disabled})`);
        safeConsole('log', `[gameplay-smoke] ${JSON.stringify({ ...setup, ...gameplay, forwardMotion, resumeQueued, resumeFinished })}`);
        const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),angleDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
        const pickupSet=new Set(gameplay.pickupKinds),pickupIcons=['orb','cache','repair','flux','salvage','fracture','relic','jammer'].every(kind=>pickupSet.has(kind));
        const roleSet=new Set(gameplay.enemyRoles),roleMarkers=['charger','tank','gunner','splitter','sniper','stalker','weaver','warden','moth','anchor'].every(role=>roleSet.has(role));
        const playerYaw=angleDistance(gameplay.playerHeading,-Math.PI/2),engineSplit=Math.abs(gameplay.leftEngineLength-gameplay.rightEngineLength);
        if (!setup.dashed || setup.floaters < 1 || gameplay.mode !== 'run' || gameplay.time <= 0 || gameplay.enemies < 1 || gameplay.floaterPool < 1 || !pickupIcons || !roleMarkers || gameplay.enemyRingCount<5 || gameplay.enemyWakeCount<1 || gameplay.hostileOutlineCount<1 || gameplay.playerCoreOpacity<.30 || gameplay.attitudeThrusters<1 || setup.presentation.renderWidth<setup.presentation.clientWidth || setup.presentation.renderHeight<setup.presentation.clientHeight || distance(gameplay.player,setup.playerStart)<40 || distance(gameplay.playerVisual,setup.playerVisualStart)<30 || distance(gameplay.enemy,setup.enemyStart)<5 || distance(gameplay.enemyVisual,setup.enemyStart)<3 || distance(gameplay.enemyVisual,gameplay.enemy)>30 || playerYaw<.08 || playerYaw>.30 || Math.abs(gameplay.playerBank)<.08 || Math.abs(gameplay.playerStrafe)<.25 || gameplay.playerRimOpacity<.14 || engineSplit<8 || forwardMotion.surge<.45 || forwardMotion.hullHeight<82 || forwardMotion.trailLength<54 || angleDistance(Math.abs(gameplay.enemyHeading),Math.PI)>.55 || !resumeQueued.requested || !resumeQueued.paused || !resumeQueued.countdown || !resumeQueued.buttonDisabled || resumeFinished.paused || resumeFinished.countdown || resumeFinished.pauseVisible || resumeFinished.buttonDisabled) process.exitCode = 1;
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
