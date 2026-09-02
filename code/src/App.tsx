import { Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import RequireAuth from "@/components/RequireAuth";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import FloorApp from "@/pages/FloorApp";
import Warehouse3D from "@/pages/Warehouse3D";
import Features from "@/pages/Features";
import Erpnext from "@/pages/Erpnext";
import Workflow from "@/pages/Workflow";
import Industries from "@/pages/Industries";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import Network from "@/pages/Network";
import Valuation from "@/pages/Valuation";
import Dispatch from "@/pages/Dispatch";
import Portal3pl from "@/pages/Portal3pl";
import MobileApp from "@/pages/MobileApp";
import Gate from "@/pages/Gate";
import ScanningBay from "@/pages/ScanningBay";
import Transport from "@/pages/Transport";
import Fleet from "@/pages/Fleet";
import PageStub from "@/pages/PageStub";
import Login from "./pages/Login"

/**
 * Access model: marketing pages are public; every operational console is
 * login-gated (RequireAuth) — live data only, no anonymous demo access.
 */
export default function App() {
  return (
    <Layout>
      <Routes>
        {/* public marketing */}
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/erpnext" element={<Erpnext />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/industries" element={<Industries />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />

        {/* login-gated operational consoles */}
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/floor-app" element={<RequireAuth><FloorApp /></RequireAuth>} />
        <Route path="/warehouse-3d" element={<RequireAuth><Warehouse3D /></RequireAuth>} />
        <Route path="/network" element={<RequireAuth><Network /></RequireAuth>} />
        <Route path="/valuation" element={<RequireAuth><Valuation /></RequireAuth>} />
        <Route path="/dispatch" element={<RequireAuth><Dispatch /></RequireAuth>} />
        <Route path="/3pl-portal" element={<RequireAuth><Portal3pl /></RequireAuth>} />
        <Route path="/mobile-app" element={<RequireAuth><MobileApp /></RequireAuth>} />
        <Route path="/gate" element={<RequireAuth><Gate /></RequireAuth>} />
        <Route path="/scanning-bay" element={<RequireAuth><ScanningBay /></RequireAuth>} />
        <Route path="/transport" element={<RequireAuth><Transport /></RequireAuth>} />
        <Route path="/fleet" element={<RequireAuth><Fleet /></RequireAuth>} />

        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <PageStub
              kicker="404"
              title="Bin not found"
              blurb="This address doesn't exist in the twin. Head back to the floor."
            />
          }
        />
      </Routes>
    </Layout>
  );
}
