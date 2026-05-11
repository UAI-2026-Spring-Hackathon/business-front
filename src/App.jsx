import { BrowserRouter, Routes, Route } from "react-router-dom";
import InvestPage from "./pages/InvestPage";
import Dashboard from "./pages/Dashboard";
import JudgePage from "./pages/JudgePage";
import DistrictsPage from "./pages/DistrictsPage";
import TickerPage from "./pages/TickerPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminPage from "./pages/AdminPage";
import ResultsPage from "./pages/ResultsPage";
import RafflePage from "./pages/RafflePage";
import TechRafflePage from "./pages/TechRafflePage";
import { DataProvider } from "./context/DataContext";

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/invest" element={<InvestPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/districts" element={<DistrictsPage />} />
          <Route path="/ticker" element={<TickerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/raffle" element={<RafflePage />} />
          <Route path="/tech-raffle" element={<TechRafflePage />} />
          <Route path="/judge" element={<JudgePage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}
