// src/components/admin/AdminDashboard.tsx
import FairnessDashboard from "@/components/admin/FairnessDashboard";
import { Routes, Route } from "react-router-dom";

// Inside the component, add:
<Routes>
    {/* Existing routes */}
    <Route path="/admin/fairness" element={<FairnessDashboard />} />
</Routes>