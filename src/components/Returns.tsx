import React, { useState, useEffect } from 'react';
import { RotateCcw, Package, CheckCircle, AlertCircle, Search, Trash2 } from 'lucide-react';
import { Product, ReturnItem } from '../types';

export default function Returns() {
  const [products, setProducts] = useState<Product[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchReturns();
  }, []);

  const fetchProducts = () => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  };

  const fetchReturns = () => {
    fetch('/api/returns').then(res => res.json()).then(setReturns);
  };

  const handleAddReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: selectedProduct.id, quantity, date })
    }).then(res => {
      if (!res.ok) throw new Error('İade kaydedilemedi');
      fetchReturns();
      setSelectedProduct(null);
      setQuantity(1);
      setDate(new Date().toISOString().split('T')[0]);
      setSearch('');
    }).catch(err => alert(err.message));
  };

  const handleApproveReturn = (id: number) => {
    fetch(`/api/returns/${id}/approve`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('İşlem başarısız');
        fetchReturns();
        alert('İade onaylandı ve ürünler stoğa eklendi.');
      })
      .catch(err => alert(err.message));
  };

  const handleDeleteReturn = (id: number) => {
    console.log(`Frontend: İade silme butonu tıklandı - ID: ${id}`);
    
    fetch(`/api/returns/${id}`, { method: 'DELETE' })
      .then(res => {
        console.log(`Frontend: Silme yanıtı - Durum: ${res.status}`);
        if (!res.ok) throw new Error('Silme işlemi başarısız');
        fetchReturns();
        alert('İade kaydı başarıyla silindi.');
      })
      .catch(err => {
        console.error(`Frontend: ID ${id} silinirken hata:`, err);
        alert(`Hata: ${err.message}`);
      });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <RotateCcw className="mr-2 text-rose-600" />
          İade Talebi Oluştur
        </h2>
        
        <form onSubmit={handleAddReturn} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Seçin</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Adet</label>
            <input 
              type="number" min="1"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
            <input 
              type="date"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={!selectedProduct}
            className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
          >
            Karantinaya Al
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">İade & Karantina Listesi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Ürün</th>
                <th className="px-6 py-4">Adet</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500 font-mono">{item.product_sku}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{item.quantity} Adet</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {item.status === 'quarantine' ? (
                      <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        <AlertCircle size={12} className="mr-1" /> Karantina
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle size={12} className="mr-1" /> Stoğa Alındı
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {item.status === 'quarantine' && (
                        <button 
                          type="button"
                          onClick={() => handleApproveReturn(item.id)}
                          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          <Package size={16} className="mr-2" /> Stoğa Al
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReturn(item.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Henüz iade kaydı bulunmuyor
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
