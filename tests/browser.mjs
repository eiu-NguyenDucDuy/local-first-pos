import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';

const profile = await mkdtemp(path.join(tmpdir(), 'family-pos-'));
const server = serve('out');
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const options = { headless: true, viewport: { width: 390, height: 844 }, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined };
let context;
const checks = [];
const pass = name => { checks.push(name); console.log('PASS', name); };
try {
  context = await chromium.launchPersistentContext(profile, options);
  let page = context.pages()[0];
  const browserVersion = await page.evaluate(() => navigator.userAgent);
  console.log('Browser', browserVersion, 'viewport 390x844');
  await page.goto(origin + '/favicon.ico');
  await page.evaluate(() => new Promise((resolve, reject) => {
    const req = indexedDB.open('LocalPosDB', 10); // Dexie v1 maps to IndexedDB version 10.
    req.onupgradeneeded = () => {
      const products = req.result.createObjectStore('products', { keyPath:'id', autoIncrement:true });
      products.createIndex('name', 'name'); products.createIndex('barcode', 'barcode');
      products.add({ name:'Legacy rice', sellingPrice:11000, barcode:'L-001', description:'Legacy note' });
    };
    req.onsuccess = () => { req.result.close(); resolve(); }; req.onerror = () => reject(req.error);
  }));
  await page.goto(origin);
  await page.getByRole('heading', { name:'Legacy rice' }).waitFor();
  await page.getByText('Sẵn sàng mở lại ngoại tuyến.').waitFor();
  assert.match(await page.getByText(/Tồn kho:/).innerText(), /1/);
  pass('TC11 v1 upgrade preserves a product and its legacy default quantity');
  await page.getByRole('link', { name:'Quản lý sản phẩm' }).click();
  const field = text => page.getByLabel(text, { exact:true });
  const btn = text => page.getByRole('button', { name:text, exact:true });
  const row = text => page.getByRole('listitem').filter({ hasText:text });
  const ui = async (name, price, barcode='', category='', stock='1') => {
    await field('Tên sản phẩm').fill(name); await field('Giá bán (VNĐ)').fill(price);
    await field('Mã vạch').fill(barcode); await field('Danh mục').fill(category); await field('Số lượng ban đầu').fill(stock);
    await btn('Lưu sản phẩm').click();
  };
  const saved = () => page.getByText('Đã lưu sản phẩm.', {exact:true}).waitFor();
  await ui(' ', '5000'); await page.getByRole('alert').filter({hasText:'tên sản phẩm'}).waitFor();
  pass('TC02 blank name is rejected');
  await ui('Oil','0'); await page.getByRole('alert').filter({hasText:'Giá bán'}).waitFor();
  await ui('Oil','-10'); await page.getByRole('alert').filter({hasText:'Giá bán'}).waitFor();
  pass('TC03 zero and negative prices are rejected');
  await ui('Oil', '14000','O-123','Pantry','0'); await saved();
  assert.match(await row('Oil').innerText(), /Tồn: 0/); pass('TC01/04 create one product with zero units');
  await ui('Another oil','100','O-123'); await page.getByRole('alert').filter({hasText:'Mã vạch'}).waitFor();
  pass('TC12 duplicate barcode blocked');
  await page.getByRole('link',{name:'Quay lại tra cứu'}).click();
  for (const query of ['oi','O-12','Pantry']) {
    await field('Tìm sản phẩm').fill(query); await page.getByRole('heading',{name:'Oil',exact:true}).waitFor();
    await page.getByRole('heading',{name:'Legacy rice'}).waitFor({state:'hidden'});
  }
  pass('TC05 lookup by name, partial barcode and category');
  await context.close(); context = await chromium.launchPersistentContext(profile, {...options, offline:true});
  page = context.pages()[0]; await page.goto(origin + '/admin/');
  await page.getByRole('heading',{name:'Thêm sản phẩm'}).waitFor();
  assert.equal(await page.evaluate(() => navigator.onLine), false);
  await row('Oil').waitFor(); pass('TC06/08 retained records and admin after offline browser process restart');
  await ui('Offline salt','9000','','Pantry','2'); await saved();
  await row('Offline salt').getByRole('button',{name:'Sửa',exact:true}).click();
  await field('Tên sản phẩm').fill('Sea salt'); await btn('Lưu sản phẩm').click(); await saved();
  await row('Sea salt').getByRole('button',{name:'Kiểm kê',exact:true}).click();
  await field('Số lượng thực tế').fill('7'); await field('Lý do kiểm kê').fill('Shelf count'); await btn('Lưu kiểm kê').click();
  await page.getByText('Đã lưu kết quả kiểm kê.').waitFor();
  await row('Sea salt').getByRole('button',{name:'Lịch sử'}).click();
  await page.getByText(/2 → 7 \(\+5\).*Shelf count/).waitFor();
  pass('TC09 count changes stock and records the before/after values and reason offline');

  await row('Sea salt').getByRole('button',{name:'Kiểm kê',exact:true}).click();
  await field('Số lượng thực tế').fill('9'); await field('Lý do kiểm kê').fill('Rollback test');
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function(...args) {
      if (this.name === 'inventoryLogs') {
        IDBObjectStore.prototype.add = add;
        throw new DOMException('Injected log failure','QuotaExceededError');
      }
      return add.apply(this,args);
    };
  });
  await btn('Lưu kiểm kê').click(); await page.getByRole('alert').filter({hasText:'Không thể lưu'}).waitFor();
  assert.match(await row('Sea salt').innerText(), /Tồn: 7/);
  await row('Sea salt').getByRole('button',{name:'Lịch sử'}).click();
  await page.getByText(/Shelf count/).waitFor();
  assert.equal(await page.getByText(/Rollback test/).count(),0); pass('TC07 stock and log roll back on an injected write failure');

  await row('Sea salt').getByRole('button',{name:'Kiểm kê',exact:true}).click();
  const second = await context.newPage(); await second.goto(origin + '/admin/');
  await second.getByRole('listitem').filter({hasText:'Sea salt'}).getByRole('button',{name:'Kiểm kê',exact:true}).click();
  await second.getByLabel('Số lượng thực tế').fill('8'); await second.getByLabel('Lý do kiểm kê').fill('Second tab');
  await second.getByRole('button',{name:'Lưu kiểm kê'}).click(); await second.getByText('Đã lưu kết quả kiểm kê.').waitFor();
  await field('Số lượng thực tế').fill('6'); await field('Lý do kiểm kê').fill('Stale'); await btn('Lưu kiểm kê').click();
  await page.getByRole('alert').filter({hasText:'vừa thay đổi'}).waitFor(); await second.close();
  pass('TC13 a stale count cannot overwrite a newer count in another tab');
  page.once('dialog', dialog => dialog.dismiss()); await row('Sea salt').getByRole('button',{name:'Ngừng bán'}).click();
  assert.match(await row('Sea salt').innerText(), /Tồn: 8/);
  page.once('dialog', dialog => dialog.accept()); await row('Sea salt').getByRole('button',{name:'Ngừng bán'}).click();
  await page.getByText('Đã ngừng bán sản phẩm.').waitFor();
  await row('Sea salt').getByRole('button',{name:'Lịch sử'}).click();
  await page.getByText(/Second tab/).waitFor();
  await page.getByRole('link',{name:'Quay lại tra cứu'}).click(); await field('Tìm sản phẩm').fill('Sea salt');
  await page.getByText('Không tìm thấy sản phẩm.').waitFor(); pass('TC14 edit and confirmed retirement hide a product while retaining its history');
  await field('Tìm sản phẩm').fill('O-123'); await page.getByRole('heading',{name:'Oil',exact:true}).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),true);
  await mkdir('test-results',{recursive:true}); await page.screenshot({path:'test-results/offline-lookup.png'});
  pass('TC10 narrow-viewport lookup fits and works offline');
  console.log(checks.length + ' browser check groups passed');
} finally {
  try { if (context) await context.close(); } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(profile, { recursive:true, force:true, maxRetries:5, retryDelay:200 });
  }
}
