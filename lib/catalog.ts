import { db, type Product } from './db';

export class CatalogError extends Error {}

export function wholeNumber(value: string, minimum: number, message: string) {
  const number = Number(value);
  if (!value.trim() || !Number.isSafeInteger(number) || number < minimum) {
    throw new CatalogError(message);
  }
  return number;
}

export function currentStock(product: Product) {
  // Version 1 displayed an omitted opening balance as one.
  return product.stock ?? 1;
}

export type ProductInput = { name: string; price: string; barcode: string; category: string };
export type ProductVersion = { id: number; revision: number };

async function activeProduct(id: number) {
  const product = await db.products.get(id);
  if (!product || product.archivedAt) throw new CatalogError('Sản phẩm đã ngừng bán hoặc không còn tồn tại.');
  return product;
}

function checkVersion(product: Product, expected: ProductVersion) {
  if ((product.revision ?? 0) !== expected.revision) {
    throw new CatalogError('Sản phẩm vừa thay đổi. Hãy mở lại để tiếp tục.');
  }
}

export async function saveProduct(input: ProductInput, openingStock: string, editing?: ProductVersion) {
  const name = input.name.trim();
  if (!name) throw new CatalogError('Vui lòng nhập tên sản phẩm.');
  const sellingPrice = wholeNumber(input.price, 1, 'Giá bán phải là số nguyên dương (VNĐ).');
  const stock = editing ? undefined : wholeNumber(openingStock, 0, 'Tồn kho phải là số nguyên từ 0.');
  const barcode = input.barcode.trim() || undefined;
  const categoryName = input.category.trim();
  return db.transaction('rw', db.products, db.categories, db.inventoryLogs, async () => {
    const old = editing ? await activeProduct(editing.id) : undefined;
    if (old && editing) checkVersion(old, editing);
    // Keep v1 duplicates readable/editable; enforce uniqueness on every newly assigned barcode.
    if (barcode && barcode !== old?.barcode && await db.products.where('barcode').equals(barcode).count()) {
      throw new CatalogError('Mã vạch đã thuộc về một sản phẩm khác.');
    }
    let categoryId: number | undefined;
    if (categoryName) {
      const key = categoryName.toLocaleLowerCase('vi');
      const category = await db.categories.where('key').equals(key).first();
      categoryId = category?.id ?? await db.categories.add({ name: categoryName, key });
    }
    const fields = { name, sellingPrice, barcode, categoryId };
    if (editing && old) {
      await db.products.update(editing.id, { ...fields, revision: (old.revision ?? 0) + 1 });
      return editing.id;
    }
    const createdAt = new Date();
    const balance = stock!;
    const id = await db.products.add({ ...fields, createdAt, stock: balance, revision: 0 });
    await db.inventoryLogs.add({ productId: id, kind: 'opening', previousStock: 0, newStock: balance,
      delta: balance, reason: 'Tồn đầu kỳ', createdAt });
    return id;
  });
}

export async function recordCount(expected: ProductVersion, counted: string, note: string) {
  const newStock = wholeNumber(counted, 0, 'Tồn kho phải là số nguyên từ 0.');
  const reason = note.trim();
  if (!reason) throw new CatalogError('Vui lòng nhập lý do kiểm kê.');
  await db.transaction('rw', db.products, db.inventoryLogs, async () => {
    const product = await activeProduct(expected.id);
    checkVersion(product, expected);
    const previousStock = currentStock(product);
    await db.products.update(expected.id, { stock: newStock, revision: expected.revision + 1 });
    await db.inventoryLogs.add({ productId: expected.id, kind: 'count', previousStock, newStock,
      delta: newStock - previousStock, reason, createdAt: new Date() });
  });
}

export async function retireProduct(expected: ProductVersion) {
  await db.transaction('rw', db.products, async () => {
    const product = await activeProduct(expected.id);
    checkVersion(product, expected);
    await db.products.update(expected.id, { archivedAt: new Date(), revision: expected.revision + 1 });
  });
}

export async function catalog() {
  return db.transaction('r', db.products, db.categories, async () => {
    const [products, categories] = await Promise.all([db.products.toArray(), db.categories.toArray()]);
    const names = new Map(categories.map(c => [c.id, c.name]));
    return products.map(p => ({ ...p, id: p.id!, category: names.get(p.categoryId) ?? '' }));
  });
}

export type CatalogRow = Awaited<ReturnType<typeof catalog>>[number];
export function matches(row: CatalogRow, text: string) {
  const query = text.trim().toLocaleLowerCase('vi');
  return [row.name, row.barcode ?? '', row.category].some(v => v.toLocaleLowerCase('vi').includes(query));
}
