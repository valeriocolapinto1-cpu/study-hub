import { chromium } from 'playwright';
const [, , url, out, w = '1280', theme] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: +w, height: 900 }, colorScheme: theme || 'light' });
p.on('pageerror', (e) => console.log('PAGEERR', e.message));
await p.goto(url);
if (process.env.RET) { await p.evaluate(() => { localStorage.setItem('sh:v1:esempio:notes', JSON.stringify({v:1,notes:{'teoria/resistori/p1':{text:'Ricordare il verso convenzionale della corrente.',createdAt:Date.now(),updatedAt:Date.now(),page:'anno-1/esempio/teoria/resistori',label:'Legge di Ohm'}}})); localStorage.setItem('sh:v1:global:examDates', JSON.stringify({esempio:'2026-12-01'})); }); await p.reload(); }
await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: true });
await b.close();
