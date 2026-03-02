import React, { useState, useEffect } from 'react';
import { Package, Hammer, Search, Plus, List, Trash2 } from 'lucide-react';
import { Product, StockItem, StockEntry } from '../types';

export default function Stock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<'stock' | 'production'>('stock');
  const [orderNo, setOrderNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'history'>('summary');

  useEffect(() => {
    fetchProducts();
    fetchStock();
    fetchEntries();
  }, []);

  const fetchProducts = () => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  };

  const fetchStock = () => {
    fetch('/api/stock').then(res => res.json()).then(setStock);
  };

  const fetchEntries = () => {
    fetch('/api/stock/entries').then(res => res.json()).then(setEntries);
  };

  const handleDeleteEntry = (id: number) => {
    console.log(`Frontend: Stok hareketi silme butonu tıklandı - ID: ${id}`);
    
    fetch(`/api/stock/${id}`, { method: 'DELETE' })
      .then(res => {
        console.log(`Frontend: Silme yanıtı - Durum: ${res.status}`);
        if (!res.ok) throw new Error('Silme işlemi başarısız');
        fetchStock();
        fetchEntries();
        alert('Stok hareketi başarıyla silindi.');
      })
      .catch(err => {
        console.error(`Frontend: ID ${id} silinirken hata:`, err);
        alert(`Hata: ${err.message}`);
      });
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: selectedProduct.id, quantity, type, order_no: orderNo, date })
    }).then(res => {
      if (!res.ok) throw new Error('Stok kaydı eklenemedi');
      fetchStock();
      fetchEntries();
      setSelectedProduct(null);
      setQuantity(1);
      setOrderNo('');
      setDate(new Date().toISOString().split('T')[0]);
      setSearch('');
    }).catch(err => alert(err.message));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Package className="mr-2 text-indigo-600" />
          Stok & Üretim Girişi
        </h2>
        
        <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Seçin</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ürün ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {search && !selectedProduct && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button 
                    key={p.id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-none"
                    onClick={() => {
                      setSelectedProduct(p);
                      setSearch(p.name);
                    }}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{p.sku}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
            <select 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={type}
              onChange={e => setType(e.target.value as 'stock' | 'production')}
            >
              <option value="stock">Mevcut Stok (Üretilmiş)</option>
              <option value="production">Üretimde Olan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adet</label>
            <input 
              type="number" min="1"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sipariş No (Opsiyonel)</label>
            <input 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Örn: #1234"
              value={orderNo}
              onChange={e => setOrderNo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
            <input 
              type="date"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button 
              type="submit"
              disabled={!selectedProduct}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
            >
              Kaydı Ekle
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('summary')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Package size={18} className="mr-2" /> Özet Görünüm
            </button>
            <button 
              onClick={() => setViewMode('history')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={18} className="mr-2" /> Hareket Geçmişi
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {viewMode === 'summary' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Ürün</th>
                  <th className="px-6 py-4">Mevcut Stok</th>
                  <th className="px-6 py-4">Üretimde</th>
                  <th className="px-6 py-4">Toplam (Stok+Üretim)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.current_stock} Adet</td>
                    <td className="px-6 py-4 font-semibold text-amber-600">{item.in_production} Adet</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{item.total_stock} Adet</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Tarih</th>
                  <th className="px-6 py-4">Ürün</th>
                  <th className="px-6 py-4">Tür</th>
                  <th className="px-6 py-4">Sipariş No</th>
                  <th className="px-6 py-4">Adet</th>
                  <th className="px-6 py-4">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{entry.product_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{entry.product_sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      {entry.type === 'stock' ? (
                        <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          Mevcut Stok
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          Üretimde
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{entry.order_no || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{entry.quantity} Adet</td>
                    <td className="px-6 py-4">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEntry(entry.id);
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Henüz bir hareket kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
