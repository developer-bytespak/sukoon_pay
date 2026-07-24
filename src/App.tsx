import { Navigate, Route, Routes } from "react-router-dom";
import type { Role } from "./engine/types";
import { ROLE_CONFIGS } from "./components/dashboard/roles";
import RequireRole from "./components/dashboard/RequireRole";
import Landing from "./pages/Landing";
import PortalChooser from "./pages/PortalChooser";
import RoleAuth from "./pages/RoleAuth";
import Store from "./pages/Store";
import SukoonCheckout from "./pages/SukoonCheckout";
import BuyerDashboard from "./pages/dashboards/BuyerDashboard";
import SellerDashboard from "./pages/dashboards/SellerDashboard";
import CourierDashboard from "./pages/dashboards/CourierDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

const DASHBOARDS: Record<Role, () => JSX.Element> = {
  buyer: BuyerDashboard,
  seller: SellerDashboard,
  courier: CourierDashboard,
  admin: AdminDashboard,
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PortalChooser />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/store" element={<Store />} />
      <Route path="/bazaar" element={<Navigate to="/store" replace />} />
      <Route path="/checkout" element={<SukoonCheckout />} />

      {(Object.keys(ROLE_CONFIGS) as Role[]).map((role) => {
        const cfg = ROLE_CONFIGS[role];
        const Dashboard = DASHBOARDS[role];
        return [
          <Route key={cfg.authPath} path={cfg.authPath} element={<RoleAuth role={role} />} />,
          <Route
            key={cfg.dashboardPath}
            path={cfg.dashboardPath}
            element={
              <RequireRole role={role}>
                <Dashboard />
              </RequireRole>
            }
          />,
          <Route key={`legacy-${role}`} path={`/${role}`} element={<Navigate to={cfg.dashboardPath} replace />} />,
        ];
      })}
    </Routes>
  );
}
