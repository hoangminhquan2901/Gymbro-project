import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../../components/admin/Sidebar";
import Topbar from "../../components/admin/Topbar";

function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;