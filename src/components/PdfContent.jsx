// PdfContent.jsx
import React, { useEffect } from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PdfContent = ({ predictionResult, onRendered }) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onRendered) {
        console.log("Rendering PDFContent selesai.");
        onRendered();
      }
    }, 1000); // Penundaan 1000ms

    return () => clearTimeout(timeoutId);
  }, [onRendered, predictionResult]);

  if (!predictionResult) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Data prediksi tidak tersedia.
      </div>
    );
  }

  const {
    barang_name: namaBarang = "Produk",
    future_forecasts: forecast = [],
    mape = 0,
    alpha: optimized_alpha = 0,
    beta: optimized_beta = 0,
    prediction_table: predictionTable = [],
    error_table: errorTable = [],
  } = predictionResult;

  // Buat historicalData dari predictionTable (menggunakan data aktual dan bulan)
  const historicalData = (predictionTable || []).map((item) => ({
    tanggal: item.bulan,
    total_jumlah: item.aktual,
  }));

  const combinedTableData = predictionTable.map((predItem) => {
    const errorItem = errorTable.find((err) => err.bulan === predItem.bulan);
    return {
      bulan: predItem.bulan,
      aktual: predItem.aktual,
      level: predItem.level,
      trend: predItem.trend,
      prediksi: errorItem ? errorItem.prediksi : null,
      error: errorItem ? errorItem.error : null,
      ape: errorItem ? errorItem.ape : null,
    };
  });

  const historicalLabels = historicalData.map((item) => item.tanggal);
  const historicalValues = historicalData.map((item) => item.total_jumlah);
  const historicalPredictionValues = combinedTableData.map((item) =>
    item.prediksi !== null ? Math.round(item.prediksi) : null
  );

  const forecastLabels = (forecast || []).map((item) => item.month);
  const forecastValues = (forecast || []).map((item) =>
    Math.round(item.forecast)
  );

  const allLabels = [...historicalLabels, ...forecastLabels];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: "Data Aktual",
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
        label: "Hasil Prediksi",
        data: Array(historicalValues.length).fill(null).concat(forecastValues),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderDash: [5, 5],
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
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

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#fff",
        width: "100%",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "bold", textAlign: "center" }}>
        Laporan Hasil Prediksi Permintaan Produk {namaBarang}
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginTop: "5px" }}>
        Metode Double Exponential Smoothing (DES)
      </p>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Ringkasan Hasil
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "center", margin: "10px" }}>
            <p style={{ fontSize: "14px", color: "#555" }}>
              Optimized Alpha (α)
            </p>
            <p
              style={{ fontSize: "32px", fontWeight: "bold", color: "#3b82f6" }}
            >
              {optimized_alpha.toFixed(3)}
            </p>
          </div>
          <div style={{ textAlign: "center", margin: "10px" }}>
            <p style={{ fontSize: "14px", color: "#555" }}>
              Optimized Beta (β)
            </p>
            <p
              style={{ fontSize: "32px", fontWeight: "bold", color: "#3b82f6" }}
            >
              {optimized_beta.toFixed(3)}
            </p>
          </div>
          <div style={{ textAlign: "center", margin: "10px" }}>
            <p style={{ fontSize: "14px", color: "#555" }}>Akurasi (MAPE)</p>
            <p
              style={{ fontSize: "32px", fontWeight: "bold", color: "#22c55e" }}
            >
              {mape.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h2
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Visualisasi Prediksi
        </h2>
        <div style={{ height: "350px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Tabel Hasil Prediksi
        </h2>
        <div style={{}}>
          {" "}
          {/* Hapus overflowX: 'auto' */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "10%",
                  }}
                >
                  No
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "45%",
                  }}
                >
                  Bulan
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "45%",
                  }}
                >
                  Hasil Prediksi
                </th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((item, index) => (
                <tr key={index}>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {index + 1}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.month}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {Math.round(item.forecast)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Tabel Perhitungan Error
        </h2>
        <div style={{}}>
          {" "}
          {/* Hapus overflowX: 'auto' */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "15%",
                  }}
                >
                  Bulan
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "10%",
                  }}
                >
                  Aktual
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "10%",
                  }}
                >
                  Level
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "10%",
                  }}
                >
                  Trend
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "15%",
                  }}
                >
                  Prediksi
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "15%",
                  }}
                >
                  Error
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    width: "25%",
                  }}
                >
                  APE (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {combinedTableData.map((item, index) => (
                <tr key={index}>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.bulan}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.aktual}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.level ? item.level.toFixed(2) : "-"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.trend ? item.trend.toFixed(2) : "-"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.prediksi ? item.prediksi.toFixed(2) : "-"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.error ? item.error.toFixed(2) : "-"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {item.ape ? item.ape.toFixed(2) + "%" : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PdfContent;
