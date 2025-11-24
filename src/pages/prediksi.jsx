// src/pages/prediksi.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart2,
  ShoppingCart,
  LogOut,
  Menu,
  Brain,
  PieChart,
  LineChart as IconLineChart,
  BarChart3Icon,
} from "lucide-react";
import Select from "react-select"; // Import komponen Select
import logo from "../assets/logo.png";

export default function LakukanPrediksi() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPredictionDropdown, setShowPredictionDropdown] = useState(true);

  const [predictionMode, setPredictionMode] = useState("auto");
  const [alpha, setAlpha] = useState("");
  const [beta, setBeta] = useState("");

  const [barangList, setBarangList] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState(null); // Ubah state menjadi objek
  const [predictionMonths, setPredictionMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  const navigate = useNavigate();
  const userName = "MINKA";

  const showMessage = (msg) => {
    setMessage(msg);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const fetchBarangList = async () => {
    try {
      const res = await axios.get(
        "https://akataraforecast.pythonanywhere.com/api/barang"
      );
      // Format data untuk react-select
      const formattedBarang = res.data.map((barang) => ({
        value: barang.kode,
        label: `${barang.nama} (${barang.kode})`,
      }));
      setBarangList(formattedBarang);
    } catch (error) {
      console.error("Error fetching barang list:", error);
      showMessage("Gagal memuat daftar barang.");
    }
  };

  const handlePredict = async () => {
    // Validasi selectedBarang
    if (!selectedBarang || !predictionMonths) {
      showMessage("Semua field harus diisi!");
      return;
    }

    if (predictionMode === "manual") {
      if (!alpha || !beta) {
        showMessage("Nilai Alpha dan Beta harus diisi!");
        return;
      }
      if (alpha < 0 || alpha > 1 || beta < 0 || beta > 1) {
        showMessage("Nilai Alpha dan Beta harus antara 0 dan 1.");
        return;
      }
    }

    setLoading(true);

    try {
      const requestData = {
        kodeBarang: selectedBarang.value, // Ambil nilai dari objek
        months: parseInt(predictionMonths),
        useManualParams: predictionMode === "manual",
      };

      if (predictionMode === "manual") {
        requestData.alpha = parseFloat(alpha);
        requestData.beta = parseFloat(beta);
      }

      const res = await axios.post(
        "https://akataraforecast.pythonanywhere.com/api/predict",
        requestData
      );

      navigate("/hasil", { state: { predictionResult: res.data } });
    } catch (error) {
      console.error("Error during prediction:", error);
      if (error.response && error.response.data && error.response.data.error) {
        showMessage(`Gagal melakukan prediksi: ${error.response.data.error}`);
      } else {
        showMessage(
          "Gagal melakukan prediksi. Cek kembali data dan parameter."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarangList();
    const resize = () => setSidebarOpen(window.innerWidth >= 768);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const handleLogout = () => {
    // Hapus semua data login
    localStorage.removeItem("loggedIn");

    // Redirect ke halaman login
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full font-sans">
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
              className="flex items-center gap-2 hover:bg-gray-200 px-3 py-2 rounded"
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
                className="flex items-center justify-between w-full px-3 py-2 rounded bg-gray-200"
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
                    className="flex items-center gap-2 text-blue-800 bg-gray-300 px-3 py-2 rounded"
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
            <h1 className="text-xl font-bold uppercase tracking-wide">
              Lakukan Prediksi
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 bg-gray-50 flex-1 overflow-y-auto">
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              Form Prediksi Metode Double Exponential Smoothing (DES)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Pilih Barang */}
              <div className="relative">
                {" "}
                {/* Tambahkan relative dan z-index */}
                <label
                  htmlFor="barang"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pilih Barang
                </label>
                <Select
                  id="barang"
                  options={barangList}
                  onChange={setSelectedBarang}
                  value={selectedBarang}
                  placeholder="Cari atau pilih barang..."
                  isClearable
                  isSearchable
                />
              </div>

              {/* Bulan Prediksi */}
              <div>
                <label
                  htmlFor="predictionMonths"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Jumlah Bulan yang Diprediksi
                </label>
                <input
                  id="predictionMonths"
                  type="number"
                  value={predictionMonths}
                  onChange={(e) => setPredictionMonths(e.target.value)}
                  min="1"
                  placeholder="Jumlah Bulan"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              {/* Pilihan Mode Prediksi */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode Prediksi
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="predictionMode"
                      value="auto"
                      checked={predictionMode === "auto"}
                      onChange={() => setPredictionMode("auto")}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Otomatis (Optimal)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="predictionMode"
                      value="manual"
                      checked={predictionMode === "manual"}
                      onChange={() => setPredictionMode("manual")}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Manual</span>
                  </label>
                </div>
              </div>

              {/* Input Alpha dan Beta (Tampilkan hanya jika mode manual dipilih) */}
              {predictionMode === "manual" && (
                <>
                  <div>
                    <label
                      htmlFor="alpha"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Alpha (α)
                    </label>
                    <input
                      id="alpha"
                      type="number"
                      step="0.01"
                      value={alpha}
                      onChange={(e) => setAlpha(e.target.value)}
                      min="0"
                      max="1"
                      placeholder="Contoh: 0.2"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="beta"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Beta (β)
                    </label>
                    <input
                      id="beta"
                      type="number"
                      step="0.01"
                      value={beta}
                      onChange={(e) => setBeta(e.target.value)}
                      min="0"
                      max="1"
                      placeholder="Contoh: 0.1"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePredict}
                disabled={loading}
                className={`bg-blue-600 text-white px-5 py-2 rounded font-semibold ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {loading ? "Memproses..." : "Lakukan Prediksi"}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Notifikasi */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg transition-transform transform translate-x-0">
          {message}
        </div>
      )}
    </div>
  );
}
