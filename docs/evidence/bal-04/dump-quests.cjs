const { chromium } = require('playwright'); const fs=require('fs');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs=[]; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]); await p.waitForFunction(() => window.__dbg, null, { timeout: 60000 });
  const d = await p.evaluate(() => ({ q: window.__dbg.QUESTS.map(q => ({k:q.k,need:q.need,minLevel:q.minLevel||0,d:q.d,t:q.t,z:(window.__dbg.PLACES[q.d]||{}).z,intro:!!q.v57intro,goals:q.goals||null,daily:!!q.daily,repeat:!!q.repeat})), enc: window.Battle.ENCOUNTERS }));
  fs.writeFileSync(process.argv[3], JSON.stringify(d)); console.log(d.q.length, errs.slice(0,3)); await b.close(); })();
