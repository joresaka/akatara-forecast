import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
} from "lucide-react";
import logo from "../assets/logo.png";

export default function DataBarang() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPredictionDropdown, setShowPredictionDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [modeEdit, setModeEdit] = useState(false);
  const [editKode, setEditKode] = useState(null);
  const [formBarang, setFormBarang] = useState({
    kode: "",
    nama: "",
    kategori: "",
    harga: "",
  });

  const navigate = useNavigate();
  const userName = "MINKA";

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://akataraforecast.pythonanywhere.com/api/barang"
      );
      setData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      setError("Gagal mengambil data dari server.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const resize = () => setSidebarOpen(window.innerWidth >= 768);
    resize();
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const results = data.filter(
      (item) =>
        item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(results);
  }, [searchTerm, data]);

  const handleLogout = () => {
    // Hapus semua data login
    localStorage.removeItem("loggedIn");

    // Redirect ke halaman login
    navigate("/");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "harga") {
      const raw = value.replace(/[^0-9]/g, "");
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(raw);
      setFormBarang((prev) => ({ ...prev, harga: formatted }));
    } else {
      setFormBarang((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hargaAngka = parseInt(formBarang.harga.replace(/[^0-9]/g, ""));
    const barangPayload = {
      kode: formBarang.kode,
      nama: formBarang.nama,
      kategori: formBarang.kategori,
      harga: hargaAngka,
    };

    try {
      if (modeEdit) {
        await axios.put(
          `https://akataraforecast.pythonanywhere.com/api/barang/${editKode}`,
          barangPayload
        );
        console.log("Barang berhasil diupdate.");
      } else {
        await axios.post(
          "https://akataraforecast.pythonanywhere.com/api/barang",
          barangPayload
        );
        console.log("Barang berhasil ditambahkan.");
      }
      fetchData();
      setFormBarang({ kode: "", nama: "", kategori: "", harga: "" });
      setShowModal(false);
      setModeEdit(false);
      setEditKode(null);
    } catch (err) {
      console.error("Error saat menyimpan barang:", err);
      setError("Gagal menyimpan data.");
    }
  };

  const handleEdit = (barang) => {
    setFormBarang({
      kode: barang.kode,
      nama: barang.nama,
      kategori: barang.kategori,
      harga: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(barang.harga),
    });
    setEditKode(barang.kode);
    setModeEdit(true);
    setShowModal(true);
  };

  const handleDelete = async (kode) => {
    try {
      await axios.delete(
        `https://akataraforecast.pythonanywhere.com/api/barang/${kode}`
      );
      console.log("Barang berhasil dihapus.");
      fetchData();
      setShowConfirmModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Error saat menghapus barang:", err);
      setError("Gagal menghapus data.");
    }
  };

  const openConfirmModal = (kode) => {
    setItemToDelete(kode);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setItemToDelete(null);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    if (!file) {
      setError("Pilih file terlebih dahulu.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `https://akataraforecast.pythonanywhere.com/api/upload-barang`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response.data.message);
      setShowUploadModal(false);
      setFile(null);
      fetchData();
    } catch (err) {
      setError("Gagal mengimpor data. Pastikan format file benar.");
      console.error("Error uploading file:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen w-full font-sans bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 top-0 left-0 w-64 h-full bg-gray-100 text-blue-900 transition-transform flex flex-col justify-between 
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          <div className="flex flex-col items-center gap-2 p-6 border-b border-gray-300">
            <img src={logo} alt="Logo" className="w-16 h-16 rounded-full" />
            <span className="text-xl font-bold">{userName}</span>
          </div>
          <nav className="mt-4 px-4 flex flex-col gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded"
            >
              <BarChart2 size={18} /> Dashboard
            </button>
            <button
              onClick={() => navigate("/data-barang")}
              className="flex items-center gap-2 px-3 py-2 rounded bg-gray-200 text-blue-900"
            >
              <ShoppingCart size={18} /> Data Barang
            </button>
            <button
              onClick={() => navigate("/penjualan")}
              className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded"
            >
              <BarChart3Icon size={18} /> Data Penjualan
            </button>
            <div className="relative">
              <button
                onClick={() =>
                  setShowPredictionDropdown(!showPredictionDropdown)
                }
                className="flex items-center justify-between w-full hover:bg-gray-200 px-3 py-2 rounded"
              >
                <span className="flex items-center gap-2">
                  <IconLineChart size={18} /> Prediksi Permintaan
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showPredictionDropdown ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              {showPredictionDropdown && (
                <div className="ml-4 mt-2 flex flex-col gap-2 text-sm transition-all duration-300 ease-in-out">
                  <button
                    onClick={() => navigate("/prediksi")}
                    className="flex items-center gap-2 text-blue-800 hover:bg-gray-300 px-3 py-2 rounded"
                  >
                    <Brain size={16} /> Lakukan Prediksi
                  </button>
                  <button
                    onClick={() => navigate("/hasil")}
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
              Data Barang
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 bg-gray-50 flex-1 overflow-y-auto">
          <div className="bg-white p-6 rounded shadow">
            <div className="mb-6 border-b pb-4">
              <h1 className="text-xl font-bold text-gray-700">
                Manajemen informasi data barang
              </h1>
            </div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {/* Action Bar & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
              {/* Searchbar - Kiri */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {/* Buttons - Kanan */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowModal(true);
                    setModeEdit(false);
                    setFormBarang({
                      kode: "",
                      nama: "",
                      kategori: "",
                      harga: "",
                    });
                  }}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                  <Plus size={16} /> Tambah Barang
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 text-sm"
                >
                  <Upload size={16} /> Import
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto">
              {loading ? (
                <div className="text-center py-8">Memuat data...</div>
              ) : (
                <table className="min-w-full text-sm text-gray-700 border">
                  <thead className="bg-gray-100 text-gray-600 text-left">
                    <tr>
                      <th className="px-4 py-2 border">No</th>
                      <th className="px-4 py-2 border">Kode Barang</th>
                      <th className="px-4 py-2 border">Nama Barang</th>
                      <th className="px-4 py-2 border">Kategori</th>
                      <th className="px-4 py-2 border">Harga Barang</th>
                      <th className="px-4 py-2 border text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((barang, index) => (
                      <tr key={barang.kode} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">{index + 1}</td>
                        <td className="px-4 py-2 border">{barang.kode}</td>
                        <td className="px-4 py-2 border">{barang.nama}</td>
                        <td className="px-4 py-2 border">{barang.kategori}</td>
                        <td className="px-4 py-2 border">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(barang.harga)}
                        </td>
                        <td className="px-4 py-2 border">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(barang)}
                              className="bg-yellow-400 text-white p-1 rounded-full hover:bg-yellow-500 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => openConfirmModal(barang.kode)}
                              className="bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredData.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-4 text-gray-400"
                        >
                          Tidak ada data barang yang cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow">
            <h2 className="text-lg font-bold mb-4">
              {modeEdit ? "Edit Barang" : "Tambah Barang"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="kode"
                value={formBarang.kode}
                onChange={handleInputChange}
                placeholder="Kode Barang"
                className="w-full border border-gray-300 px-3 py-2 rounded"
                required
                readOnly={modeEdit}
              />
              <input
                type="text"
                name="nama"
                value={formBarang.nama}
                onChange={handleInputChange}
                placeholder="Nama Barang"
                className="w-full border border-gray-300 px-3 py-2 rounded"
                required
              />
              <input
                type="text"
                name="kategori"
                value={formBarang.kategori}
                onChange={handleInputChange}
                placeholder="Kategori"
                className="w-full border border-gray-300 px-3 py-2 rounded"
                required
              />
              <input
                type="text"
                name="harga"
                value={formBarang.harga}
                onChange={handleInputChange}
                placeholder="Harga Barang (Rp)"
                className="w-full border border-gray-300 px-3 py-2 rounded"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setModeEdit(false);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-sm shadow">
            <h3 className="font-bold text-lg mb-4">Konfirmasi Hapus</h3>
            <p className="mb-4">
              Apakah Anda yakin ingin menghapus barang ini?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 rounded bg-gray-300 text-gray-800"
              >
                Tidak
              </button>
              <button
                onClick={() => handleDelete(itemToDelete)}
                className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Unggah File */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-sm shadow">
            <h3 className="font-bold text-lg mb-4">Unggah File Excel</h3>
            <p className="mb-4 text-sm text-gray-600">
              Pastikan file Excel Anda memiliki kolom dengan nama:
              <code className="bg-gray-200 px-1 rounded mx-1">kode</code>,
              <code className="bg-gray-200 px-1 rounded mx-1">nama</code>,
              <code className="bg-gray-200 px-1 rounded mx-1">kategori</code>,
              dan
              <code className="bg-gray-200 px-1 rounded mx-1">harga</code>.
            </p>
            <form onSubmit={handleUpload} className="space-y-4">
              <input
                type="file"
                onChange={handleFileChange}
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
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className={`px-4 py-2 rounded text-white ${
                    !file || uploading
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {uploading ? "Mengunggah..." : "Unggah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
