import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataPenjualan from './pages/datapenjualan';
import Prediksi from './pages/prediksi';
import DataBarang from './pages/databarang';
import HasilPrediksi from './pages/hasilprediksi';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/penjualan" element={<DataPenjualan />} />
        <Route path="/prediksi" element={<Prediksi />} />
        <Route path="/data-barang" element={<DataBarang />} />
        <Route path="/hasil" element={<HasilPrediksi />} />
      </Routes>
    </Router>
  );
}

export default App;