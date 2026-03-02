import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Product, Platform } from '../types';

const PLATFORMS: Platform[] = ['So-mass Web', 'Beymen', 'Hipicon', 'Nowshopfun', 'Denizli Mağaza', 'Diğer'];

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [platform, setPlatform] = useState<Platform>('So-mass Web');
  const [quantity, setQuantity] = useState(1);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [orderNo, setOrderNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');

  useEffect(() => {
    fetchProducts();
    fetchRecentSales();
  }, []);

  const fetchProducts = () => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  };

  const fetchRecentSales = () => {
    fetch('/api/sales').then(res => res.json()).then(setRecentSales);
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const basePrice = selectedProduct.price * quantity;
    if (discountType === 'amount') {
      return Math.max(0, basePrice - discountValue);
    } else {
      return Math.max(0, basePrice * (1 - discountValue / 100));
    }
  };

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: selectedProduct.id,
        platform,
        quantity,
        discount_type: discountType,
        discount_value: discountValue,
        total_price: calculateTotal(),
        order_no: orderNo,
        date: date
      })
    }).then(res => {
      if (!res.ok) throw new Error('Satış kaydedilemedi');
      fetchRecentSales();
      setSelectedProduct(null);
      setQuantity(1);
      setDiscountValue(0);
      setOrderNo('');
      setDate(new Date().toISOString().split('T')[0]);
      setSearch('');
    }).catch(err => alert(err.message));
  };

  const handleDeleteSale = (id: number) => {
    console.log(`Frontend: Satış silme butonu tıklandı - ID: ${id}`);
    
    fetch(`/api/sales/${id}`, { method: 'DELETE' })
      .then(res => {
        console.log(`Frontend: Silme yanıtı - Durum: ${res.status}`);
        if (!res.ok) throw new Error('Silme işlemi başarısız');
        fetchRecentSales();
        alert('Satış kaydı başarıyla silindi.');
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
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setViewMode('form')}
          className={`flex items-center px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'form' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ShoppingCart size={18} className="mr-2" /> Satış İşle
        </button>
        <button 
          onClick={() => setViewMode('history')}
          className={`flex items-center px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Check size={18} className="mr-2" /> Satış Geçmişi
        </button>
      </div>

      {viewMode === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ShoppingCart className="mr-2 text-indigo-600" />
                Satış İşle
              </h2>
              
              <form onSubmit={handleRecordSale} className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Seçin (SKU veya İsim)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                          <p className="font-semibold text-indigo-600">₺{p.price.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                    <select 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={platform}
                      onChange={e => setPlatform(e.target.value as Platform)}
                    >
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sipariş No</label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Örn: #12345"
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
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">İndirim</label>
                    <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                      <button 
                        type="button"
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${discountType === 'amount' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setDiscountType('amount')}
                      >
                        Tutar (₺)
                      </button>
                      <button 
                        type="button"
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${discountType === 'percentage' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setDiscountType('percentage')}
                      >
                        Oran (%)
                      </button>
                    </div>
                  </div>
                  <input 
                    type="number" step="0.01"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    placeholder={discountType === 'amount' ? 'İndirim Tutarı' : 'İndirim Oranı'}
                    value={discountValue}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div>
                    <p className="text-sm text-indigo-600 font-medium">Toplam Tutar</p>
                    <h3 className="text-3xl font-bold text-indigo-900">₺{calculateTotal().toLocaleString()}</h3>
                  </div>
                  <button 
                    type="submit"
                    disabled={!selectedProduct}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Satışı Onayla
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Son Satışlar</h3>
              <div className="space-y-4">
                {recentSales.slice(0, 5).map(sale => (
                  <div key={sale.id} className="group flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                      <Check size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{sale.product_name}</p>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSale(sale.id);
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex flex-col">
                          <p className="text-xs text-gray-500">{sale.platform}</p>
                          <div className="flex items-center space-x-2">
                            {sale.order_no && <p className="text-[10px] text-indigo-400 font-mono">{sale.order_no}</p>}
                            <p className="text-[10px] text-gray-400">{new Date(sale.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900">₺{sale.total_price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentSales.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Henüz satış bulunmuyor</p>
                  </div>
                )}
                <button 
                  onClick={() => setViewMode('history')}
                  className="w-full py-2 text-sm text-indigo-600 font-bold hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Tümünü Gör
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Satış Geçmişi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Tarih</th>
                  <th className="px-6 py-4">Ürün</th>
                  <th className="px-6 py-4">Platform</th>
                  <th className="px-6 py-4">Sipariş No</th>
                  <th className="px-6 py-4">Adet</th>
                  <th className="px-6 py-4">Tutar</th>
                  <th className="px-6 py-4">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{sale.product_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{sale.product_sku}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{sale.platform}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{sale.order_no || '-'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{sale.quantity} Adet</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">₺{sale.total_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSale(sale.id);
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Henüz satış kaydı bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
