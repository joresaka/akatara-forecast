import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart2,
  ShoppingCart,
  Menu,
  LogOut,
  Package,
  LineChart as IconLineChart,
  Brain,
  PieChart,
  BarChart3Icon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import logo from '../assets/logo.png';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataTrend, setDataTrend] = useState([]);
  const [barData, setBarData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalBarang: 0,
    totalPenjualan: 0,
  });

  const [barangList, setBarangList] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState('ALL');

  // 🟡 Filter bulan dan tahun
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [availableYears, setAvailableYears] = useState([]);
  const [penjualanData, setPenjualanData] = useState([]);

  const [showPredictionDropdown, setShowPredictionDropdown] = useState(false);

  const navigate = useNavigate();
  const userName = 'MINKA';

  // Palet warna batang
  const COLORS = [
    '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316',
    '#22c55e','#6366f1','#eab308','#06b6d4','#fb7185','#4ade80','#a78bfa','#f87171',
    '#fbbf24','#34d399','#60a5fa','#c084fc','#f472b6','#93c5fd','#fde047','#5eead4',
    '#d946ef','#7dd3fc','#facc15','#2dd4bf','#fda4af','#4ade80','#818cf8','#fcd34d'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [penjualanRes, barangRes] = await Promise.all([
          axios.get('https://akataraforecast.pythonanywhere.com/api/penjualan'),
          axios.get('https://akataraforecast.pythonanywhere.com/api/barang'),
        ]);

        const penjualan = penjualanRes.data;
        const barangData = barangRes.data;

        setBarangList(barangData);
        setPenjualanData(penjualan);

        // Ambil tahun unik dari data penjualan untuk dropdown filter
        const years = [...new Set(penjualan.map(item => new Date(item.tanggal).getFullYear()))];
        setAvailableYears(years.sort((a, b) => b - a)); // descending

        // Ringkasan
        const totalBarang = barangData.length;
        const totalJumlahPenjualan = penjualan.reduce((sum, item) => sum + item.jumlah, 0);
        setSummaryData({
          totalBarang,
          totalPenjualan: totalJumlahPenjualan,
        });

        // Grafik Tren Semua Barang
        updateTrend(penjualan, 'ALL');

        // Hitung total penjualan per barang (default semua bulan dan tahun)
        updateBarData(penjualan, "ALL", "ALL", barangData);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const resize = () => setSidebarOpen(window.innerWidth >= 768);
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // 🔵 Update data line chart trend bulanan
  const updateTrend = (penjualanData, kodeBarang) => {
    const trend = penjualanData.reduce((acc, curr) => {
      if (kodeBarang !== 'ALL' && curr.kode_barang !== kodeBarang) return acc;

      const date = new Date(curr.tanggal);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      acc[key] = (acc[key] || 0) + curr.jumlah;
      return acc;
    }, {});

    const trendArray = Object.keys(trend).map(key => ({
      bulan: key,
      penjualan: trend[key],
    }));

    setDataTrend(trendArray);
  };

  // 🟠 Update data bar chart total per barang berdasarkan bulan & tahun
  const updateBarData = (penjualan, bulan, tahun = selectedYear, barangDataList = barangList) => {
    let filtered = penjualan;

    if (bulan !== "ALL") {
      filtered = filtered.filter((p) => {
        const date = new Date(p.tanggal);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return month === bulan;
      });
    }

    if (tahun !== "ALL") {
      filtered = filtered.filter((p) => {
        const date = new Date(p.tanggal);
        return date.getFullYear().toString() === tahun;
      });
    }

    const totalPerBarang = barangDataList.map((b) => {
      const total = filtered
        .filter((p) => p.kode_barang === b.kode)
        .reduce((sum, p) => sum + p.jumlah, 0);
      return { nama: b.nama, total };
    });

    setBarData(totalPerBarang);
  };

  const handleBarangChange = async (e) => {
    const kode = e.target.value;
    setSelectedBarang(kode);

    try {
      const penjualanRes = await axios.get('https://akataraforecast.pythonanywhere.com/api/penjualan');
      updateTrend(penjualanRes.data, kode);
    } catch (err) {
      console.error('Error fetching penjualan by barang:', err);
    }
  };

  const handleMonthChange = (e) => {
    const bulan = e.target.value;
    setSelectedMonth(bulan);
    updateBarData(penjualanData, bulan, selectedYear);
  };

  const handleYearChange = (e) => {
    const tahun = e.target.value;
    setSelectedYear(tahun);
    updateBarData(penjualanData, selectedMonth, tahun);
  };

  const handleLogout = () => navigate('/');

  const currentPath = window.location.pathname;

  return (
    <div className="flex h-screen w-full font-sans bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 top-0 left-0 w-64 h-full bg-gray-100 text-blue-900 transition-transform flex flex-col justify-between 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div>
          <div className="flex flex-col items-center gap-2 p-6 border-b border-gray-300">
            <img src={logo} alt="Logo" className="w-16 h-16 rounded-full" />
            <span className="text-xl font-bold">{userName}</span>
          </div>
          <nav className="mt-4 px-4 flex flex-col gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${currentPath === '/dashboard' ? 'bg-gray-200 text-blue-800' : 'hover:bg-gray-200'}`}
            >
              <BarChart2 size={18} /> Dashboard
            </button>
            <button 
              onClick={() => navigate('/data-barang')} 
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${currentPath === '/data-barang' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
            >
              <ShoppingCart size={18} /> Data Barang
            </button>
            <button 
              onClick={() => navigate('/penjualan')} 
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${currentPath === '/penjualan' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
            >
              <BarChart3Icon size={18} /> Data Penjualan
            </button>
            
            {/* Dropdown Prediksi */}
            <div className="relative">
              <button
                onClick={() => setShowPredictionDropdown(!showPredictionDropdown)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded transition-colors ${currentPath.startsWith('/prediksi') || currentPath.startsWith('/hasil') ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
              >
                <span className="flex items-center gap-2">
                  <IconLineChart size={18} /> Prediksi Permintaan
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showPredictionDropdown ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {showPredictionDropdown && (
                <div className={`ml-4 mt-2 flex flex-col gap-2 text-sm transition-all duration-300 ease-in-out ${currentPath.startsWith('/prediksi') || currentPath.startsWith('/hasil') ? 'text-white' : 'text-blue-800'}`}>
                  <button
                    onClick={() => navigate('/prediksi')}
                    className={`flex items-center gap-2 px-3 py-2 rounded ${currentPath === '/prediksi' ? 'bg-blue-700' : 'hover:bg-gray-300'}`}
                  >
                    <Brain size={16} /> Lakukan Prediksi
                  </button>
                  <button
                    onClick={() => navigate('/hasil')}
                    className={`flex items-center gap-2 px-3 py-2 rounded ${currentPath === '/hasil' ? 'bg-blue-700' : 'hover:bg-gray-300'}`}
                  >
                    <PieChart size={16} /> Hasil Prediksi
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded flex items-center justify-center gap-2 hover:bg-red-700"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="text-gray-200 bg-blue-900 h-20 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              className="p-2 hover:bg-gray-300 rounded"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={28} />
            </button>
            <h1 className="text-xl font-bold uppercase tracking-wide">
              Dashboard AKATARA
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 bg-gray-50 flex-1 overflow-y-auto">
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center gap-3 text-blue-600 font-semibold">
                <Package size={18} /> Jumlah Barang
              </div>
              <p className="text-3xl font-bold mt-2 text-blue-700">{summaryData.totalBarang}</p>
              <p className="text-sm text-gray-500">Total jenis barang yang tersedia</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center gap-3 text-green-600 font-semibold">
                <ShoppingCart /> Total Penjualan
              </div>
              <p className="text-3xl font-bold mt-2 text-green-700">{summaryData.totalPenjualan}</p>
              <p className="text-sm text-gray-500">Total barang yang terjual dari semua transaksi</p>
            </div>
          </div>

          {/* Line Chart Tren Bulanan */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
              <h2 className="text-lg font-bold text-gray-700">
                Tren Penjualan Bulanan
              </h2>
              <select
                value={selectedBarang}
                onChange={handleBarangChange}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="ALL">Semua Barang</option>
                {barangList.map(b => (
                  <option key={b.kode} value={b.kode}>
                    {b.nama}
                  </option>
                ))}
              </select>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dataTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis label={{ value: 'Jumlah Terjual', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} Barang`, 'Total Penjualan']} />
                <Line type="monotone" dataKey="penjualan" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart Total Penjualan per Barang */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
              <h2 className="text-lg font-bold text-gray-700">
                Total Penjualan per Barang
              </h2>
              <div className="flex gap-2">
                {/* Dropdown Bulan */}
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="ALL">Semua Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>

                {/* Dropdown Tahun */}
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="ALL">Semua Tahun</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nama"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: 'Total Terjual', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip
                  formatter={(v) => [`${v} Barang`, 'Total Terjual']}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="total" name="Jumlah Terjual">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  );
}
