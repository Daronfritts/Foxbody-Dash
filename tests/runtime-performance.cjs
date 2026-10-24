/* Run with: node tests/runtime-performance.cjs (requires Playwright + Chromium). */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const errors = [];
  let requests = 0, active = 0, maxActive = 0, delay = 0, tuning = false;
  let data = {engine:{rpm:1000,speed:25,coolant:180,battery:14,oil:40},vehicle:{gear:2,trip:12,outsideTemp:70},lights:{left_turn:false},warnings:{oil:false}};
  const server = http.createServer(async (req,res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/tuning/')) {
      if(url.pathname.endsWith('/open'))tuning=true;
      if(url.pathname.endsWith('/close'))tuning=false;
      res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({active:tuning,simulation:true}));return;
    }
    if (url.pathname === '/api/vehicle') {
      requests++;active++;maxActive=Math.max(maxActive,active);
      const snapshot = JSON.stringify(data);
      await new Promise(resolve=>setTimeout(resolve,delay));
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(snapshot);active--;
      return;
    }
    if (url.pathname === '/api/assets') {
      res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({shapes:[],materials:[],images:[],gaugeParts:[],icons:[],indicators:[]}));return;
    }
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname === '/'?'/index.html':url.pathname));
    if (!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    try {
      const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(await fs.readFile(file));
    } catch {res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
    const page=await browser.newPage({viewport:{width:2560,height:720}});
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(()=>window.FoxDashVehicle?.engine?.rpm===1000);
    await page.evaluate(()=>{
      const C=window.FoxDashCatalog;
      const item=(template,id,extra={})=>C.fromTemplate(template,{id,...extra});
      const needle=item(C.templates.gaugeParts[1],'assembly-needle',{dataSource:'engine.rpm'});
      const digital=item(C.templates.gaugeParts[3],'assembly-digital',{dataSource:'engine.rpm'});
      const items=[
        ...['classic','tapered','wedge','race','slim'].map((needleStyle,i)=>item(C.templates.widgets[0],'gauge-'+needleStyle,{x:i*18,y:5,w:17,h:40,gaugeShape:i%2?'rectangle':'ellipse',config:{...C.templates.widgets[0].defaults.config,needleStyle}})),
        {id:'assembly',type:'gaugeAssembly',name:'Custom',dataSource:'engine.rpm',x:0,y:48,w:20,h:40,children:[item(C.templates.gaugeParts[0],'ticks'),needle,digital]},
        item(C.templates.widgets[1],'digital',{x:22,y:48}),
        item(C.templates.widgets[2],'bar',{x:45,y:48}),
        item(C.templates.widgets[3],'info'),item(C.templates.widgets[4],'status'),
        item(C.templates.widgets[5],'nav'),item(C.templates.widgets[6],'shift'),
        item(C.templates.icons[0],'system'),
        {id:'indicator',type:'icon',x:85,y:48,w:5,h:10,visible:true,dataSource:'lights.left_turn',assetUrl:'assets/images/mustangWhite.svg',config:{role:'indicator'}}
      ];
      localStorage.setItem('foxbodyDash.studio.v13',JSON.stringify({version:7,canvas:{color:'#000'},items}));
      localStorage.setItem('foxbodyDash.appearance.tickColors',JSON.stringify({'gauge-classic':'#12abcd'}));
    });
    await page.reload();
    await page.waitForFunction(()=>document.querySelectorAll('.dashNode').length===17);
    await page.waitForTimeout(150);
    await page.evaluate(()=>{
      window.originalNodes=[...document.querySelectorAll('.dashNode, .gaugeTick, .gaugeNeedleGroup > *, .navStrip button')];
      window.originalMarkup=document.querySelector('[data-id="gauge-classic"] .gaugeNeedleGroup').innerHTML;
    });
    const before=requests;
    data.engine.rpm=5500;data.engine.speed=63;data.engine.coolant=220;data.vehicle.gear=3;data.lights.left_turn=true;data.warnings.oil=true;
    await page.waitForTimeout(1250);
    const updated=await page.evaluate(()=>({
      retained:originalNodes.every(node=>node.isConnected),
      changed:originalMarkup!==document.querySelector('[data-id="gauge-classic"] .gaugeNeedleGroup').innerHTML,
      rpm:document.querySelector('[data-id="gauge-classic"] .gaugeLiveValue').textContent,
      assembly:document.querySelector('[data-id="assembly"] .gaugePartDigital').textContent,
      digital:document.querySelector('[data-id="digital"] strong').textContent,
      bar:document.querySelector('[data-id="bar"] .barGaugeFill').style.width,
      gear:document.querySelector('[data-id="info"] .infoGear strong').textContent,
      indicator:document.querySelector('[data-id="indicator"] .nodeSurface').style.opacity,
      warning:document.querySelector('[data-id="status"] img[alt="Oil Pressure"]').style.opacity,
      yellow:document.querySelector('.shiftLight').classList.contains('shiftYellow'),
      dimmer:document.querySelector('[data-id="factory-left-turn-dimmer"] .nodeSurface').style.background,
      tick:document.querySelector('[data-id="gauge-classic"] .gaugeTick').getAttribute('stroke'),
      fatal:document.getElementById('fatalError').hidden
    }));
    assert.equal(updated.retained,true,'live updates must retain all gauge, tick, needle and nav nodes');
    assert.equal(updated.changed,true);assert.equal(updated.rpm,'5500');assert.equal(updated.assembly,'5500');
    assert.equal(updated.digital,'63');assert.equal(updated.bar,'75%');assert.equal(updated.gear,'3');
    assert.equal(updated.indicator,'1');assert.equal(updated.warning,'1');assert.equal(updated.yellow,true);
    assert.equal(updated.dimmer,'transparent');assert.equal(updated.tick,'#12abcd');assert.equal(updated.fatal,true);
    assert.ok(requests-before>=8 && requests-before<=18,`single ~10Hz feed, got ${requests-before} requests`);
    console.log('PASS: 10Hz shared feed; retained DOM; all needle styles, assembly, digital, bar, info, warnings, indicators, shift colors and saved appearance');

    // Delayed HTTP responses must not overlap or let an older response replace a newer sample.
    delay=250;maxActive=0;
    await page.waitForTimeout(1000);
    assert.equal(maxActive,1,'slow requests must remain serialized');
    delay=0;data.engine.rpm=6500;data.lights.left_turn=false;data.warnings.oil=false;
    await page.waitForFunction(()=>document.querySelector('[data-id="gauge-classic"] .gaugeLiveValue').textContent==='6500');
    await page.waitForTimeout(120);
    assert.equal(await page.locator('.shiftLight').evaluate(n=>n.classList.contains('shiftRed')),true);
    assert.equal(await page.locator('[data-id="indicator"] .nodeSurface').evaluate(n=>n.style.opacity),'0');
    console.log('PASS: slow requests do not overlap; feed recovers and indicators/shift lights follow latest sample');

    await page.locator('#editModeButton').dispatchEvent('click');
    await page.locator('[data-id="digital"]').dispatchEvent('pointerdown',{pointerId:1,clientX:600,clientY:400});
    await page.dispatchEvent('body','pointerup',{pointerId:1});
    await page.locator('#fieldName').fill('Speed edited');await page.locator('#fieldName').dispatchEvent('change');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#fieldName').inputValue(),'Speed edited');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foxbodyDash.studio.v13.draft')).items.find(i=>i.id==='digital').name),'Speed edited');
    await page.locator('#saveLayoutButton').dispatchEvent('click');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foxbodyDash.studio.v13')).items.find(i=>i.id==='digital').name),'Speed edited');
    assert.equal(await page.locator('.navStrip button').allTextContents().then(a=>a.join(',')),'HOME,VEHICLE,MUSIC,DIAGNOSTICS,SETTINGS');
    await page.evaluate(()=>window.FoxTuningMode.open());
    assert.equal(tuning,true);
    assert.equal(await page.locator('#tuningModeOverlay').evaluate(n=>n.hidden),false);
    await page.evaluate(()=>window.FoxTuningMode.close());
    assert.equal(tuning,false);
    assert.equal(await page.locator('#tuningModeOverlay').evaluate(n=>n.hidden),true);
    assert.deepEqual(errors,[]);
    console.log('PASS: editor selection/properties/save and run-mode navigation survive live updates; no browser errors');
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
