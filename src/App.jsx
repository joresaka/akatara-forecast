import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DataPenjualan from "./pages/datapenjualan";
import Prediksi from "./pages/prediksi";
import DataBarang from "./pages/databarang";
import HasilPrediksi from "./pages/hasilprediksi";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* LOGIN (public) */}
        <Route path="/" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/penjualan"
          element={
            <ProtectedRoute>
              <DataPenjualan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/prediksi"
          element={
            <ProtectedRoute>
              <Prediksi />
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-barang"
          element={
            <ProtectedRoute>
              <DataBarang />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hasil"
          element={
            <ProtectedRoute>
              <HasilPrediksi />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
