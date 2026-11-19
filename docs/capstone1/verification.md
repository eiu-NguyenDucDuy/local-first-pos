# Capstone 1 demonstration and verification

Use Node 24 and a clean working copy of the feature branch. The two public routes are `/` (price lookup) and `/admin/` (catalog and stock counts). One browser profile and origin represent one store for this proof of concept. Both roles can physically access either screen.

```sh
npm ci
npm run lint
npm test
npm run build
npx --no-install playwright-core install chromium
npm run test:e2e
npm start
```

The production demo opens at `http://127.0.0.1:3000`. Keep the same origin and port. Open the app online, wait for “Sẵn sàng mở lại ngoại tuyến.”, disconnect, close the tab and reopen the same URL. Create a product with stock zero, look it up, edit its price, record a physical count with a reason, then retire it. The history stays in Administration. Development mode skips service-worker registration.

The automated browser run creates a disposable profile, seeds a v1 record, upgrades it, restarts Chromium offline, and exercises the actual exported routes. It also injects a local write failure and submits a stale count from a second tab. The profile is removed after the test. On a machine with Chromium already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable before running the browser check. A narrow desktop viewport is a layout check. Physical-phone and shop-user testing have separate acceptance criteria.

The cache covers the exported assets on a root-hosted HTTPS origin or localhost. Catalog and inventory records live in IndexedDB. Each opening balance and later count is committed with its history entry. The numeric keys of existing products are retained. Category is optional, barcode is optional and an assigned barcode stays reserved after retirement. Existing duplicate barcodes are retained on upgrade. Older records only acquire a history when a count is recorded. Backups, authentication, multi-store access and synchronization remain later-stage work.
