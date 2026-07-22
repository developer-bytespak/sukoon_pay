import { Route, Routes, useLocation } from "react-router-dom";
import DemoControls, { DEMO_BAR_HIDDEN_ROUTES } from "./components/DemoControls";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Bazaar from "./pages/Bazaar";
import SukoonCheckout from "./pages/SukoonCheckout";
import BuyerView from "./pages/BuyerView";
import SellerDashboard from "./pages/SellerDashboard";
import CourierPanel from "./pages/CourierPanel";
import AdminConsole from "./pages/AdminConsole";
import ShariaPanel from "./pages/ShariaPanel";

export default function App() {
  const { pathname } = useLocation();
  const barVisible = !DEMO_BAR_HIDDEN_ROUTES.includes(pathname);
  return (
    <div className={`min-h-screen ${barVisible ? "pb-24" : ""}`}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/bazaar" element={<Bazaar />} />
        <Route path="/checkout" element={<SukoonCheckout />} />
        <Route path="/buyer" element={<BuyerView />} />
        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/courier" element={<CourierPanel />} />
        <Route path="/admin" element={<AdminConsole />} />
        <Route path="/sharia" element={<ShariaPanel />} />
      </Routes>
      <DemoControls />
    </div>
  );
}
