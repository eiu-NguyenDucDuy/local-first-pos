import Dexie, { Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  sellingPrice: number;
  description?: string;
  barcode?: string;
  stock?: number;         // Default 1
  unit?: string;          // Default "Cái / Gói / ..."
  createdAt?: Date;
}

export class LocalPosDatabase extends Dexie {
  products!: Table<Product>;

  constructor() {
    super('LocalPosDB');
    this.version(1).stores({
      products: '++id, barcode, name'
    });
  }
}

export const db = new LocalPosDatabase();