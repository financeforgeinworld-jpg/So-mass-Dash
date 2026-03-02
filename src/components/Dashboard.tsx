import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingCart, Package, RotateCcw, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [velocityPeriod, setVelocityPeriod] = useState<'1m' | '3m' | '6m'>('1m');

  useEffect(() => {
    fetch('/api/reports/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="p-8">Yükleniyor...</div>;

  const stats = [
    { label: 'Toplam Ciro', value: `₺${data.stats.total.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Aylık Ciro', value: `₺${data.stats.monthly.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Haftalık Ciro', value: `₺${data.stats.weekly.toLocaleString()}`, icon: ShoppingCart, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Platform Bazlı Satışlar</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.salesByPlatform}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="platform"
                  label
                >
                  {data.salesByPlatform.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">En Hızlı Satan Ürünler (Satış Hızı)</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['1m', '3m', '6m'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setVelocityPeriod(period)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    velocityPeriod === period ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {period === '1m' ? '1 Ay' : period === '3m' ? '3 Ay' : '6 Ay'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.velocities[velocityPeriod]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="velocity" fill="#6366f1" radius={[4, 4, 0, 0]} name="Günlük Satış Hızı" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
