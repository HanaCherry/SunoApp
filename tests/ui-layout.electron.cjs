// Run with Electron: electron tests/ui-layout.electron.cjs <temporary-output-directory>
const { app, BrowserWindow, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const output = process.argv[2];
if (!output) throw new Error('A temporary output directory is required');
fs.mkdirSync(output, { recursive: true });
app.setPath('userData', path.join(output, 'profile'));
app.commandLine.appendSwitch('disable-gpu');
const root = path.resolve(__dirname, '..');
const files = [...Array.from({ length: 13 }, (_, i) => `sunoapp-i18n-${i + 1}.js`),
    'sunoapp-site-language.js', 'sunoapp-theme.js', 'main-enhancements.js', 'sunoapp-enh-2.js', 'sunoapp-enh-3.js', 'sunoapp-enh-3b.js',
    'sunoapp-enh-4.js', 'sunoapp-enh-5.js', 'sunoapp-enh-6.js'];
const source = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('').replace(/\}\)\(\);\s*$/, `
    window.__testRain = bass => {
        state.audioContext = { sampleRate: 48000 };
        state.audioElement = { paused: false, muted: false };
        state.analyser = {frequencyBinCount:1024,fftSize:2048,getByteFrequencyData:b=>{b.fill(0);for(let i=2;i<=7;i++)b[i]=bass;}};
        if (!musicRainFrame) musicRainFrame=requestAnimationFrame(animateMusicRain);
    };
})();`);
const fixture = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#111;color:white;font:16px Arial}
#app{position:relative;background:#141414}header{position:fixed;inset:0 0 auto;height:54px;background:#272727;z-index:100}
nav{position:fixed;left:0;top:54px;bottom:80px;width:210px;background:var(--color-background-secondary,#212121);color:var(--color-foreground-primary,white)}
main{position:fixed;top:54px;left:230px;right:20px;bottom:90px;overflow:auto}
footer{position:fixed;bottom:0;left:0;right:0;height:80px;background:#303030}
button{padding:10px;margin:4px}.row{height:90px;display:flex;align-items:center;gap:8px}
#profile{display:flex;gap:8px;height:50px}#profile img{width:24px;height:24px}
</style></head><body><div id="app" style="height:100vh;max-height:100vh;min-height:200px;overflow:hidden">
<header>Page de contrôle de disposition</header><nav><a href="/create">Créer</a><div id="profile"><img><span>100 Credits</span></div></nav>
<main><h1>Bibliothèque de test</h1><div class="row"><img width="64" height="64"><span>Test song</span><button>Play</button><button>Like</button><button>More</button></div></main>
<footer><button aria-label="Playbar: Play">Play</button><a aria-label="Playbar: Title">Test song</a><button>Volume</button></footer>
</div><script>navigator.mediaSession.metadata=new MediaMetadata({title:'Test song',artist:'Test artist'});</script></body></html>`;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
setTimeout(() => { console.error('UI test timeout'); app.exit(1); }, 45000);
app.whenReady().then(async () => {
    const errors = [];
    try {
        const testSession = session.fromPartition('ui-layout-test');
        await testSession.protocol.handle('https', () => new Response(fixture, { headers: { 'content-type': 'text/html' } }));
        const win = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: { offscreen: true, session: testSession, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
        win.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
        const snapshot = `(() => {
            const rect = element => { const r=element.getBoundingClientRect();return [r.x,r.y,r.width,r.height]; };
            return {rootStyle:document.getElementById('app').getAttribute('style'),
                root:rect(document.getElementById('app')),header:rect(document.querySelector('header')),nav:rect(document.querySelector('nav')),
                profile:rect(document.getElementById('profile')),main:rect(document.querySelector('main')),footer:rect(document.querySelector('footer')),
                filter:getComputedStyle(document.getElementById('app')).filter,backdrop:getComputedStyle(document.querySelector('nav')).backdropFilter,
                padding:getComputedStyle(document.body).paddingTop};
        })()`;
        for (const [width, height, theme, route] of [[1280,800,'nuit','/'],[900,600,'clair','/create'],[1100,700,'glass','/studio']]) {
            win.setContentSize(width,height);
            await win.loadURL('https://suno.com'+route);
            await win.webContents.executeJavaScript(`localStorage.clear();localStorage.setItem('sunoapp-ui-theme',${JSON.stringify(theme)});localStorage.setItem('sunoapp-custom-player-enabled','true');`);
            const before = await win.webContents.executeJavaScript(snapshot);
            await win.webContents.executeJavaScript(source);
            await wait(2700); // Covers both page-mode and profile/bounds timer regressions.
            assert.deepEqual(await win.webContents.executeJavaScript(snapshot),before,theme+' preserves native layout');
            assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('sunoapp-titlebar')).display"),'none');
            assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('sunoapp-now-card')).display"),'none');
            await win.webContents.executeJavaScript('window.__sunoAppOpenSettings()');
            await wait(250);
            const bounds = await win.webContents.executeJavaScript(`(() => {const r=document.querySelector('.sa-settings-card').getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,open:document.getElementById('sunoapp-settings-overlay').classList.contains('open')};})()`);
            assert.ok(bounds.open && bounds.x>=0 && bounds.y>=0 && bounds.right<=width && bounds.bottom<=height,JSON.stringify(bounds));
            assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.getElementById('sunoapp-settings-overlay')).display"),'grid');
            if (theme==='clair') fs.writeFileSync(path.join(output,'settings-900.png'),(await win.webContents.capturePage()).toPNG());
            await win.webContents.executeJavaScript("document.getElementById('sunoapp-close-settings').click()");
            assert.equal(await win.webContents.executeJavaScript("document.getElementById('sunoapp-settings-overlay').classList.contains('open')"),false);
            console.log('PASS layout, settings, theme',width,height,theme,route);
        }
        const nativeColors = new Set();
        const initialLayout = await win.webContents.executeJavaScript(snapshot);
        for (const theme of ['nuit','clair','cherry','aurore','glass','aero','musique','galaxy']) {
            await win.webContents.executeJavaScript(`document.querySelector('.sa-theme[data-theme="${theme}"]').click()`);
            assert.deepEqual(await win.webContents.executeJavaScript(snapshot), initialLayout, theme+' keeps geometry');
            const result = await win.webContents.executeJavaScript(`(() => {
                const luminance = color => color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=color.startsWith('color(srgb')?1:255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
                const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
                const nav=getComputedStyle(document.querySelector('nav'));
                return {background:nav.backgroundColor,contrast:contrast(nav.color,nav.backgroundColor),options:['sunoapp-lang','sunoapp-site-lang'].map(id=>{const style=getComputedStyle(document.getElementById(id).options[1]);return contrast(style.color,style.backgroundColor);})};
            })()`);
            nativeColors.add(result.background);
            assert.ok(result.contrast>=4.5,theme+' native text contrast');
            assert.ok(result.options.every(value=>value>=4.5),theme+' language popup contrast');
        }
        assert.equal(nativeColors.size,8);
        const galaxy = await win.webContents.executeJavaScript(`(() => {
            document.getElementById('sunoapp-close-settings').click();
            const sky = document.getElementById('sunoapp-galaxy-sky');
            const button = document.querySelector('main button');
            const r = button.getBoundingClientRect();
            return {stars:sky.querySelectorAll('.sa-gb-stars i').length,
                petals:sky.querySelectorAll('.sa-gb-petals i').length,
                animation:getComputedStyle(sky.querySelector('.sa-gb-stars i')).animationName,
                clickable:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2) === button};
        })()`);
        assert.deepEqual(galaxy,{stars:90,petals:8,animation:'saGbTwinkle',clickable:true});
        await wait(400);
        fs.writeFileSync(path.join(output,'galaxy.png'),(await win.webContents.capturePage()).toPNG());
        await win.webContents.executeJavaScript(`document.querySelector('.sa-theme[data-theme="nuit"]').click()`);
        assert.equal(await win.webContents.executeJavaScript("document.getElementById('sunoapp-galaxy-sky') === null"),true);
        console.log('PASS Galaxy animated effects, clickable controls, cleanup when switching theme');
        await win.webContents.executeJavaScript(`document.querySelector('.sa-theme[data-theme="musique"]').click();window.__SUNO_APP_THEME.apply('musique',['#22bbff','#dd55ff']);`);
        await wait(2600);
        const music = await win.webContents.executeJavaScript(`(() => {
            const sky=document.getElementById('sunoapp-galaxy-sky');
            return {mode:sky.dataset.mode, color:getComputedStyle(sky.querySelector('.n1')).backgroundColor,
                star:getComputedStyle(sky.querySelector('.sa-gb-stars i')).backgroundColor,
                fade:getComputedStyle(sky.querySelector('.n1')).transitionDuration,
                shoot:getComputedStyle(sky.querySelector('.sa-gb-shoot')).animationName};
        })()`);
        assert.deepEqual(music,{mode:'musique',color:'rgb(34, 187, 255)',star:'rgb(34, 187, 255)',fade:'2.4s',shoot:'saGbShoot'});
        console.log('PASS music automatic star colors and 2.4s color transitions');
        await win.webContents.executeJavaScript('window.__testRain(255)');
        await wait(650);
        const position = () => win.webContents.executeJavaScript("['--star-x','--star-y'].map(key=>parseFloat(document.querySelector('.sa-gb-stars i').style.getPropertyValue(key)))");
        const loud = await position();
        await win.webContents.executeJavaScript('window.__testRain(0)');
        await wait(1100);
        const quiet = await position();
        assert.ok(Math.hypot(...loud)>1);
        assert.deepEqual(quiet,loud,'No movement without bass');
        await win.webContents.executeJavaScript('window.__testRain(255)');
        await wait(650);
        const next = await position();
        assert.ok(loud[0]*(next[0]-quiet[0])+loud[1]*(next[1]-quiet[1])<0,'Next bass impact changes direction');
        assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.querySelector('.sa-gb-stars i')).animationName"),'none');
        fs.writeFileSync(path.join(output,'music-stars.png'),(await win.webContents.capturePage()).toPNG());
        console.log('PASS four-point stars move on bass only and reverse direction on next impact');
        console.log('PASS all 8 native palettes, unchanged layout, both language lists contrast >= 4.5:1');
        // Separate app-language selection from Suno's real locale preference.
        await win.webContents.executeJavaScript(`
            window.__sunoAppOpenSettings();
            const appLanguage = document.getElementById('sunoapp-lang');
            appLanguage.value = 'fr'; appLanguage.dispatchEvent(new Event('change'));
            document.getElementById('sunoapp-site-lang').value = 'ja';
        `);
        assert.equal((await testSession.cookies.get({ url: 'https://suno.com', name: 'i18next' })).length, 0);
        const loaded = new Promise(resolve => win.webContents.once('did-finish-load', resolve));
        await win.webContents.executeJavaScript("setTimeout(()=>document.getElementById('sunoapp-site-lang-apply').click(),50); undefined");
        await loaded;
        assert.equal(win.webContents.getURL(), 'https://suno.com/studio');
        assert.equal((await testSession.cookies.get({ url: 'https://suno.com', name: 'i18next' }))[0].value, 'ja');
        await win.webContents.executeJavaScript(source);
        assert.equal(await win.webContents.executeJavaScript("document.getElementById('sunoapp-site-lang').value"), 'ja');
        assert.equal(await win.webContents.executeJavaScript("localStorage.getItem('sunoapp-lang')"), 'fr');
        console.log('PASS native locale cookie, reload, saved preference, independent app language');
        assert.deepEqual(errors,[]);
        win.close(); app.exit(0);
    } catch(error) { console.error(error.stack); console.error(errors); app.exit(1); }
});
