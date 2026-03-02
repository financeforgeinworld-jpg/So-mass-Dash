export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  photo_url?: string;
}

export interface Sale {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  platform: string;
  quantity: number;
  discount_type: 'amount' | 'percentage';
  discount_value: number;
  total_price: number;
  order_no?: string;
  date: string;
}

export interface ReturnItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  status: 'quarantine' | 'returned';
  date: string;
}

export interface StockItem {
  id: number;
  sku: string;
  name: string;
  current_stock: number;
  in_production: number;
  total_stock: number;
}

export interface StockEntry {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  type: 'stock' | 'production';
  order_no?: string;
  date: string;
}

export type Platform = 'So-mass Web' | 'Beymen' | 'Hipicon' | 'Nowshopfun' | 'Denizli Mağaza' | 'Diğer';
