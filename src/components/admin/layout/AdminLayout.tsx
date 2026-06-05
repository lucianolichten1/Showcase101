import { Outlet } from "react-router-dom";
import "@/styles/admin.css";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  return (
    <div className="admin admin-shell">
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        <AdminSidebar />
      </div>

      <div className="admin-main min-h-screen lg:pl-[248px]">
        <div className="admin-main-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
