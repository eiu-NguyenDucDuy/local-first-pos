import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  sellingPrice: number;
  description?: string;
  barcode?: string;
  stock?: number;
  unit?: string;
  createdAt?: Date;
  categoryId?: number;
  archivedAt?: Date;
  revision?: number;
}

export interface Category {
  id?: number;
  name: string;
  key: string;
}

export interface InventoryLog {
  id?: number;
  productId: number;
  kind: 'opening' | 'count';
  previousStock: number;
  newStock: number;
  delta: number;
  reason: string;
  createdAt: Date;
}

export class LocalPosDatabase extends Dexie {
  products!: Table<Product, number>;
  categories!: Table<Category, number>;
  inventoryLogs!: Table<InventoryLog, number>;

  constructor() {
    super('LocalPosDB');
    this.version(1).stores({ products: '++id, barcode, name' });
    this.version(2).stores({
      products: '++id, barcode, name, categoryId',
      categories: '++id, &key',
      inventoryLogs: '++id, productId',
    });
  }
}

export const db = new LocalPosDatabase();
