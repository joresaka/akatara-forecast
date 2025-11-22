import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart2,
  ShoppingCart,
  LineChart as IconLineChart,
  LogOut,
  Brain,
  PieChart,
  BarChart3Icon,
  Menu,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Search,
  CalendarDays,
} from 'lucide-react';
import logo from '../assets/logo.png';

export default function DataPenjualan() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPredictionDropdown, setShowPredictionDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    tanggal: '',
    kodeBarang: '',
    namaBarang: '',
    jumlah: '',
    total: '',
  });
  const [message, setMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  const navigate = useNavigate();
  const userName = 'MINKA';

  const fetchData = async () => {
    try {
      const res = await axios.get("https://akataraforecast.pythonanywhere.com/api/penjualan");
      setData(res.data);
      setFilteredData(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage("Gagal memuat data penjualan.");
    }
  };

  useEffect(() => {
    fetchData();
    const resize = () => setSidebarOpen(window.innerWidth >= 768);
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    let result = data;

    if (startDate && endDate) {
      result = result.filter(item => {
        const itemDate = new Date(item.tanggal);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    if (searchTerm) {
      result = result.filter(item =>
        item.kode_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredData(result);
  }, [data, searchTerm, startDate, endDate]);

  const handleLogout = () => navigate('/');

  const showMessage = (msg) => {
    setMessage(msg);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'total') {
      const raw = value.replace(/[^0-9]/g, '');
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(raw);
      setForm(prev => ({ ...prev, total: formatted }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalAngka = parseInt(form.total.replace(/[^0-9]/g, ''));

    const payload = {
      tanggal: form.tanggal,
      kodeBarang: form.kodeBarang,
      namaBarang: form.namaBarang,
      jumlah: parseInt(form.jumlah),
      total: totalAngka,
    };

    try {
      let res;
      if (isEdit) {
        res = await axios.put(`https://akataraforecast.pythonanywhere.com/api/penjualan/${editId}`, payload);
      } else {
        res = await axios.post("https://akataraforecast.pythonanywhere.com/api/penjualan", payload);
      }
      showMessage(res.data.message);
      fetchData();
    } catch (error) {
      console.error("Error submitting data:", error);
      showMessage("Gagal menyimpan data!");
    }

    setForm({ tanggal: '', kodeBarang: '', namaBarang: '', jumlah: '', total: '' });
    setShowModal(false);
    setIsEdit(false);
    setEditId(null);
  };

  const handleEdit = (item) => {
    setForm({
      tanggal: item.tanggal,
      kodeBarang: item.kode_barang,
      namaBarang: item.nama_barang,
      jumlah: item.jumlah,
      total: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(item.total),
    });
    setEditId(item.id);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const res = await axios.delete(`https://akataraforecast.pythonanywhere.com/api/penjualan/${id}`);
        showMessage(res.data.message);
        fetchData();
      } catch (error) {
        console.error("Error deleting data:", error);
        showMessage("Gagal menghapus data!");
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    if (!file) {
      showMessage("Pilih file CSV/Excel terlebih dahulu!");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("https://akataraforecast.pythonanywhere.com/api/upload-penjualan", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showMessage(res.data.message);
      fetchData();
      setFile(null);
      setShowUploadModal(false);
    } catch (error) {
      console.error("Error upload file:", error);
      showMessage("Gagal upload file!");
    } finally {
      setUploading(false);
    }
  };

  const handleResetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setShowDateFilterModal(false);
  };

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
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded">
              <BarChart2 size={18} /> Dashboard
            </button>
            <button onClick={() => navigate('/data-barang')} className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded">
              <ShoppingCart size={18} /> Data Barang
            </button>
            <button onClick={() => navigate('/penjualan')} className="flex items-center gap-2 px-3 py-2 rounded bg-gray-200 text-blue-900">
              <BarChart3Icon size={18} /> Data Penjualan
            </button>
            <div className="relative">
              <button
                onClick={() => setShowPredictionDropdown(!showPredictionDropdown)}
                className="flex items-center justify-between w-full hover:bg-gray-200 px-3 py-2 rounded"
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
                <div className="ml-4 mt-2 flex flex-col gap-2 text-sm transition-all duration-300 ease-in-out">
                  <button
                    onClick={() => navigate('/prediksi')}
                    className="flex items-center gap-2 text-blue-800 hover:bg-gray-300 px-3 py-2 rounded"
                  >
                    <Brain size={16} /> Lakukan Prediksi
                  </button>
                  <button
                    onClick={() => navigate('/hasil')}
                    className="flex items-center gap-2 text-blue-800 hover:bg-gray-300 px-3 py-2 rounded"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
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
            <h1 className="text-xl font-bold uppercase tracking-wide">Data Penjualan</h1>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 bg-gray-50 flex-1 overflow-y-auto">
          <div className="bg-white p-6 rounded shadow">
            <div className="mb-6 border-b pb-4">
              <h1 className="text-xl font-bold text-gray-700">Manajemen transaksi penjualan</h1>
            </div>

            {/* ACTION & FILTER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0 md:space-x-4">
              
              {/* Searchbar */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Cari nama atau kode barang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Buttons with flex-1 for uniform size */}
              <div className="flex items-center w-full md:w-auto space-x-2">
                <button
                  onClick={() => setShowDateFilterModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600"
                >
                  <CalendarDays size={16} /> Filter
                </button>
                <button 
                  onClick={() => { setShowModal(true); setIsEdit(false); setForm({ tanggal: '', kodeBarang: '', namaBarang: '', jumlah: '', total: '' }); }} 
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                  <Plus size={16} /> Tambah
                </button>
                <button 
                  onClick={() => setShowUploadModal(true)} 
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded text-sm hover:bg-emerald-600"
                >
                  <Upload size={16} /> Import
                </button>
              </div>
            </div>

            {/* Tabel */}
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-gray-700 border">
                <thead className="bg-gray-100 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-2 border">No</th>
                    <th className="px-4 py-2 border">Tanggal</th>
                    <th className="px-4 py-2 border">Kode Barang</th>
                    <th className="px-4 py-2 border">Nama Barang</th>
                    <th className="px-4 py-2 border">Jumlah</th>
                    <th className="px-4 py-2 border">Total</th>
                    <th className="px-4 py-2 border text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{index + 1}</td>
                      <td className="px-4 py-2 border">{item.tanggal}</td>
                      <td className="px-4 py-2 border">{item.kode_barang}</td>
                      <td className="px-4 py-2 border">{item.nama_barang}</td>
                      <td className="px-4 py-2 border">{item.jumlah}</td>
                      <td className="px-4 py-2 border">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(item.total)}
                      </td>
                      <td className="px-4 py-2 border">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEdit(item)} className="bg-yellow-400 text-white p-1 rounded-full hover:bg-yellow-500 transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-gray-400">
                        Tidak ada data penjualan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-bold mb-4">{isEdit ? 'Edit' : 'Tambah'} Penjualan</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="tanggal" type="date" value={form.tanggal} onChange={handleInputChange} required className="w-full border px-3 py-2 rounded" />
              <input name="kodeBarang" placeholder="Kode Barang" value={form.kodeBarang} onChange={handleInputChange} required className="w-full border px-3 py-2 rounded" />
              <input name="namaBarang" placeholder="Nama Barang" value={form.namaBarang} onChange={handleInputChange} required className="w-full border px-3 py-2 rounded" />
              <input name="jumlah" type="number" placeholder="Jumlah" value={form.jumlah} onChange={handleInputChange} required className="w-full border px-3 py-2 rounded" />
              <input name="total" placeholder="Total (Rp)" value={form.total} onChange={handleInputChange} required className="w-full border px-3 py-2 rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowModal(false); setForm({ tanggal: '', kodeBarang: '', namaBarang: '', jumlah: '', total: '' }); setIsEdit(false); }} className="px-4 py-2 bg-gray-300 text-gray-800 rounded">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Unggah File */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-sm shadow">
            <h3 className="font-bold text-lg mb-4">Unggah File CSV/Excel</h3>
            <p className="mb-4 text-sm text-gray-600">
              Pastikan file Anda memiliki kolom dengan nama: 
              <code className="bg-gray-200 px-1 rounded mx-1">tanggal</code>, 
              <code className="bg-gray-200 px-1 rounded mx-1">kodeBarang</code>, 
              <code className="bg-gray-200 px-1 rounded mx-1">namaBarang</code>, 
              <code className="bg-gray-200 px-1 rounded mx-1">jumlah</code>, dan
              <code className="bg-gray-200 px-1 rounded mx-1">total</code>.
            </p>
            <form onSubmit={handleUpload} className="space-y-4">
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".csv, .xlsx"
                className="w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUploadModal(false);
                    setFile(null);
                  }} 
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!file || uploading} 
                  className={`px-4 py-2 rounded text-white ${!file || uploading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {uploading ? 'Mengunggah...' : 'Unggah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Filter Tanggal */}
      {showDateFilterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-xs shadow">
            <h3 className="font-bold text-lg mb-4">Pilih Rentang Tanggal</h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Tanggal Mulai:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <label className="block text-sm font-medium text-gray-700">Tanggal Akhir:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                type="button" 
                onClick={handleResetDateFilter} 
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 text-sm"
              >
                Reset
              </button>
              <button 
                type="button" 
                onClick={() => setShowDateFilterModal(false)} 
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notifikasi */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg transition-transform transform translate-x-0">
          {message}
        </div>
      )}
    </div>
  );
}