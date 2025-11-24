import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart2,
  ShoppingCart,
  LineChart as IconLineChart,
  LogOut,
  Brain,
  PieChart,
  BarChart3Icon,
  Menu,
  Maximize,
  X,
  Download,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import logo from "../assets/logo.png";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import PdfContent from "../components/PdfContent";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HasilPrediksi() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPredictionDropdown, setShowPredictionDropdown] = useState(false);
  const [isChartFullScreen, setIsChartFullScreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userName = "MINKA";

  const predictionResult = location.state?.predictionResult;

  useEffect(() => {
    if (!predictionResult) {
      // Jika tidak ada data, log ke console dan arahkan kembali
      console.warn("predictionResult kosong, mengarahkan ke /prediksi");
      navigate("/prediksi");
    } else {
      // Log data yang diterima untuk debugging
      console.log("Data Prediksi Diterima:", predictionResult);
    }

    const resize = () => setSidebarOpen(window.innerWidth >= 768);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [predictionResult, navigate]);

  const handleLogout = () => {
    // Hapus semua data login
    localStorage.removeItem("loggedIn");

    // Redirect ke halaman login
    navigate("/");
  };
  const toggleChartFullScreen = () => setIsChartFullScreen(!isChartFullScreen);

  const handleExportPDF = async () => {
    if (!predictionResult) {
      alert("Data prediksi tidak tersedia untuk diekspor.");
      return;
    }
    // ... (Kode Export PDF Anda tidak diubah) ...
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.top = "0";
    tempDiv.style.left = "0";
    tempDiv.style.width = "1200px";
    tempDiv.style.height = "auto";
    tempDiv.style.background = "white";
    document.body.appendChild(tempDiv);

    const root = ReactDOM.createRoot(tempDiv);
    let resolveRender;
    const renderPromise = new Promise((resolve) => {
      resolveRender = resolve;
    });

    try {
      root.render(
        <PdfContent
          predictionResult={predictionResult}
          onRendered={resolveRender}
        />
      );
      await renderPromise;
      await new Promise((r) => setTimeout(r, 1000));
      const dataUrl = await htmlToImage.toPng(tempDiv, {
        quality: 1.0,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(
        `Hasil_Prediksi_${predictionResult.barang_name || "Produk"}.pdf`
      );
    } catch (error) {
      console.error("Terjadi kesalahan saat mengekspor PDF!", error);
      alert("Terjadi kesalahan saat mengekspor PDF. Silakan coba lagi.");
    } finally {
      root.unmount();
      document.body.removeChild(tempDiv);
    }
    // ... (Akhir Kode Export PDF) ...
  };
  if (!predictionResult) return null;

  // ✅ PERUBAHAN 1: Sesuaikan properti dengan output JSON dari backend (prediksi.py)
  const {
    barang_name: namaBarang = "Produk", // Rename 'barang_name'
    future_forecasts: forecast = [], // Rename 'future_forecasts'
    mape = 0,
    alpha: optimized_alpha = 0, // Rename 'alpha'
    beta: optimized_beta = 0, // Rename 'beta'
    prediction_table: predictionTable = [], // Rename 'prediction_table'
    error_table: errorTable = [], // Rename 'error_table'
  } = predictionResult || {};

  // ✅ PERUBAHAN 2: Buat historicalData untuk grafik dari predictionTable
  // Karena backend tidak mengirim properti historicalData, kita gunakan data aktual dari predictionTable.
  const historicalDataForChart = (predictionTable || []).map((item) => ({
    tanggal: item.bulan, // Gunakan 'bulan' sebagai label tanggal
    total_jumlah: item.aktual, // Gunakan 'aktual' sebagai nilai historis
  }));

  const historicalLabels = historicalDataForChart.map((item) => {
    // Karena item.tanggal adalah string ('Bulan Tahun') dari backend, tidak perlu konversi Date
    return item.tanggal;
  });
  const historicalValues = historicalDataForChart.map(
    (item) => item.total_jumlah
  );

  const forecastLabels = forecast.map((item) => item.month);
  const forecastValues = forecast.map((item) => Math.round(item.forecast));

  const allLabels = [...historicalLabels, ...forecastLabels];

  // ✅ Gabungkan predictionTable dan errorTable (Logika ini sudah benar)
  const combinedTableData = (predictionTable || []).map((predItem) => {
    // Cari data error berdasarkan bulan yang sama
    const errorItem = (errorTable || []).find(
      (err) => err.bulan === predItem.bulan
    );

    // PENTING: Untuk data tabel error (yang merupakan hasil perhitungan akurasi),
    // backend Anda hanya mengirimkan data dari index 1 (looping dari 1, len(series) - baris 112 prediksi.py)
    // Level dan Trend hanya ada di predictionTable (looping dari 0 - baris 98 prediksi.py)
    // Kita gabungkan apa adanya, tapi ingat baris pertama mungkin hilang data prediksi/error

    return {
      bulan: predItem.bulan,
      aktual: predItem.aktual,
      level: predItem.level,
      trend: predItem.trend,
      // Ambil prediksi, error, dan ape dari errorTable jika bulan cocok
      prediksi: errorItem ? errorItem.prediksi : null,
      error: errorItem ? errorItem.error : null,
      ape: errorItem ? errorItem.ape : null,
    };
  });

  // 🎯 PERUBAHAN UTAMA: Ambil nilai prediksi historis (dari errorTable)
  // Nilai prediksi historis ada di properti 'prediksi' dari combinedTableData, dan kita bulatkan
  const historicalPredictionValues = combinedTableData.map((item) =>
    item.prediksi !== null ? Math.round(item.prediksi) : null
  );

  // Gabungkan historical prediction dengan future forecast. Future forecast akan melanjutkan data prediksi historis.
  const historicalAndFuturePredictionValues = [
    ...historicalPredictionValues,
    ...forecastValues, // Forecast values sudah disiapkan untuk melanjutkan setelah historicalValues
  ];

  // Buat array data untuk 'Hasil Prediksi Masa Depan'.
  // Karena kita akan menggunakan satu dataset prediksi yang menyambung,
  // kita perlu menyesuaikan data yang lama.

  const data = {
    labels: allLabels,
    datasets: [
      {
        label: "Data Aktual",
        // Data aktual hanya ada selama historicalLabels
        data: historicalValues.concat(Array(forecast.length).fill(null)),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        tension: 0.2,
      },
      {
        label: "Prediksi Historis",
        // Data Prediksi Historis (dari errorTable) akan muncul di masa lalu
        data: historicalPredictionValues.concat(
          Array(forecast.length).fill(null)
        ),
        borderColor: "rgb(255, 159, 64)", // Warna baru (Orange)
        backgroundColor: "rgba(255, 159, 64, 0.5)",
        borderDash: [2, 2], // Garis putus-putus untuk prediksi historis
        tension: 0.2,
        pointRadius: 3, // Tambahkan poin untuk membedakan
      },
      {
        label: "Prediksi Masa Depan",
        // Kita perlu memulai Prediksi Masa Depan dari bulan terakhir data historis (index terakhir historicalValues)
        // Kita gunakan array null sampai satu index sebelum akhir historical data
        // Kemudian ambil nilai prediksi historis terakhir (historicalPredictionValues.at(-1)) sebagai titik sambung
        // Setelah itu barulah kita masukkan forecastValues
        data: Array(historicalValues.length - 1)
          .fill(null)
          .concat([historicalPredictionValues.at(-1)]) // Sambungkan dengan prediksi terakhir
          .concat(forecastValues),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderDash: [5, 5],
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Perbandingan Data Aktual vs Prediksi DES",
      },
    },
    scales: {
      x: { title: { display: true, text: "Bulan" } },
      y: { title: { display: true, text: "Jumlah Penjualan" }, min: 0 },
    },
  };

  const getMapeInterpretation = (mapeValue) => {
    // MAPE yang diterima dari backend sudah dalam persentase (misal: 16.0254)
    const roundedMape = mapeValue / 100; // Konversi kembali ke desimal untuk interpretasi
    if (roundedMape <= 0.1)
      return { text: "Sangat Baik", color: "text-green-600" };
    if (roundedMape <= 0.2) return { text: "Baik", color: "text-blue-600" };
    if (roundedMape <= 0.5) return { text: "Cukup", color: "text-yellow-600" };
    return { text: "Rendah", color: "text-red-600" };
  };

  const mapeInterpretation = getMapeInterpretation(mape);

  return (
    <div className="flex h-screen w-full font-sans">
      {/* Sidebar */}
      <div
        className={`main-sidebar fixed md:relative z-40 top-0 left-0 w-64 h-full bg-gray-100 text-blue-900 transition-transform flex flex-col justify-between
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="main-header text-gray-200 bg-blue-900 h-20 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              className="p-2 hover:bg-gray-300 rounded"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={28} />
            </button>
            <h1 className="text-xl font-bold uppercase tracking-wide">
              Hasil Prediksi
            </h1>
          </div>
        </header>

        <main className="p-6 bg-gray-50 flex-1 overflow-y-auto">
          {/* Judul dan Aksi */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Hasil Prediksi Permintaan Produk {namaBarang}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700"
              >
                <Download size={20} /> Export PDF
              </button>
              <button
                onClick={() => navigate("/prediksi")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Prediksi Baru
              </button>
            </div>
          </div>

          {/* Parameter dan Akurasi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Parameter DES
              </h3>
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <span className="text-4xl font-bold text-blue-600">
                    {optimized_alpha.toFixed(3)}
                  </span>
                  <p className="text-sm text-gray-500">Alpha (α)</p>
                </div>
                <div className="text-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {optimized_beta.toFixed(3)}
                  </span>
                  <p className="text-sm text-gray-500">Beta (β)</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
              <h3 className="text-lg font-semibold text-gray-700">
                Akurasi Prediksi
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* ✅ PERUBAHAN 3: Hilangkan perkalian *100* karena backend sudah mengalikan 100 */}
                <span className="text-5xl font-bold text-green-600">
                  {mape.toFixed(2)}%
                </span>
                <p className="text-sm text-gray-500">
                  Mean Absolute Percentage Error (MAPE)
                </p>
                <p className={`mt-2 font-bold ${mapeInterpretation.color}`}>
                  Status: {mapeInterpretation.text}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Interpretasi MAPE
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-200 rounded-full"></span>
                  <span className="flex-1">Sangat Baik (&lt; 10%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-200 rounded-full"></span>
                  <span className="flex-1">Baik (10% - 20%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-200 rounded-full"></span>
                  <span className="flex-1">Cukup (20% - 50%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-200 rounded-full"></span>
                  <span className="flex-1">Rendah (&gt; 50%)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700">
                Visualisasi Prediksi
              </h3>
              <button
                onClick={toggleChartFullScreen}
                className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
                aria-label="Perbesar Grafik"
              >
                {isChartFullScreen ? (
                  <X size={20} className="text-gray-600" />
                ) : (
                  <Maximize size={20} className="text-gray-600" />
                )}
              </button>
            </div>
            <div style={{ height: isChartFullScreen ? "80vh" : "300px" }}>
              <Line data={data} options={options} />
            </div>
          </div>

          {/* Tabel Prediksi */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold mb-4 text-gray-700">
              Tabel Hasil Prediksi
            </h3>
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-gray-700 border border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border text-center">No</th>
                    <th className="px-4 py-2 border text-center">Bulan</th>
                    <th className="px-4 py-2 border text-center">
                      Hasil Prediksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forecast && forecast.length > 0 ? (
                    forecast.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {item.month}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {Math.round(item.forecast)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-4 text-gray-400"
                      >
                        Belum ada hasil prediksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel Error */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-gray-700">
              Perhitungan Error
            </h3>
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-gray-700 border border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border text-center">Bulan</th>
                    <th className="px-4 py-2 border text-center">Aktual</th>
                    <th className="px-4 py-2 border text-center">Level</th>
                    <th className="px-4 py-2 border text-center">Trend</th>
                    <th className="px-4 py-2 border text-center">Prediksi</th>
                    <th className="px-4 py-2 border text-center">Error</th>
                    <th className="px-4 py-2 border text-center">APE (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedTableData && combinedTableData.length > 0 ? (
                    combinedTableData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border text-left">
                          {item.bulan}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {item.aktual}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {item.level !== null ? item.level.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {item.trend !== null ? item.trend.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {item.prediksi !== null
                            ? item.prediksi.toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {item.error !== null ? item.error.toFixed(2) : "-"}
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {item.ape !== null ? item.ape.toFixed(2) + "%" : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-4 text-gray-400"
                      >
                        Data perhitungan tidak tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
