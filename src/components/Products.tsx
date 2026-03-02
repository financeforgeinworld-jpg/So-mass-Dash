import React, { useState, useEffect } from 'react';
import { Plus, Search, FileDown, FileUp, Image as ImageIcon, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', price: '', photo_url: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price) })
    }).then(res => {
      if (!res.ok) throw new Error('Ürün eklenemedi');
      fetchProducts();
      setShowAddForm(false);
      setNewProduct({ sku: '', name: '', price: '', photo_url: '' });
    }).catch(err => alert(err.message));
  };

  const handleDeleteProduct = (id: number) => {
    console.log(`Frontend: Ürün silme butonu tıklandı - ID: ${id}`);
    // confirm() diyaloğu bazı ortamlarda engellendiği için kaldırıldı.
    
    fetch(`/api/products/${id}`, { method: 'DELETE' })
      .then(res => {
        console.log(`Frontend: Silme yanıtı - Durum: ${res.status}`);
        if (!res.ok) throw new Error('Silme işlemi başarısız');
        fetchProducts();
        alert('Ürün ve bağlı tüm veriler başarıyla silindi.');
      })
      .catch(err => {
        console.error(`Frontend: ID ${id} silinirken hata:`, err);
        alert(`Hata: ${err.message}`);
      });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "somass_products.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('İçe aktarma başarısız');
        fetchProducts();
        alert('Ürünler başarıyla içe aktarıldı');
      }).catch(err => alert(err.message));
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h2>
        <div className="flex items-center space-x-2">
          <label className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer shadow-sm transition-all">
            <FileUp size={18} className="mr-2" />
            Excel İçe Aktar
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
            <FileDown size={18} className="mr-2" />
            Excel Dışa Aktar
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all"
          >
            <Plus size={18} className="mr-2" />
            Yeni Ürün
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              placeholder="SKU Kodu" 
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newProduct.sku}
              onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
              required
            />
            <input 
              placeholder="Ürün Adı" 
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newProduct.name}
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              required
            />
            <input 
              placeholder="Fiyat (₺)" 
              type="number" step="0.01"
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newProduct.price}
              onChange={e => setNewProduct({...newProduct, price: e.target.value})}
              required
            />
            <input 
              placeholder="Fotoğraf URL (Opsiyonel)" 
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newProduct.photo_url}
              onChange={e => setNewProduct({...newProduct, photo_url: e.target.value})}
            />
            <div className="md:col-span-4 flex justify-end space-x-2">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
              >
                İptal
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-sm"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
          <Search size={18} className="text-gray-400 mr-2" />
          <input 
            placeholder="Ürün veya SKU ara..." 
            className="bg-transparent border-none outline-none text-sm w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Görsel</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Ürün Adı</th>
                <th className="px-6 py-4">Fiyat</th>
                <th className="px-6 py-4">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {product.photo_url ? (
                      <img src={product.photo_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{product.sku}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">₺{product.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
