/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";
import { ExportImportPage } from "./components/ExportImportPage";
import { AccountsReceivablePage } from "./components/AccountsReceivablePage";
import { ReportsPage } from "./components/ReportsPage";
import { CustomersPage } from "./components/CustomersPage";
import { AdminCompaniesPage } from "./components/admin/AdminCompaniesPage";
import { AdminCompanyDetailsPage } from "./components/admin/AdminCompanyDetailsPage";
import { AdminLayout } from "./components/admin/layout/AdminLayout";
import { LoginPage } from "./components/auth/LoginPage";
import { NoCompanyAssignedPage } from "./components/auth/NoCompanyAssignedPage";
import {
  RequireAuth,
  RequireFinancialModuleAccess,
  RequireSuperAdmin,
  RootRedirect,
  LegacyCompanyWorkspaceRedirect,
} from "./components/auth/RouteGuards";
import { CompanyDataProvider } from "./domains/company/CompanyDataContext";
import { ExpensesPage } from "./components/ExpensesPage";
import { RevenuePage } from "./components/RevenuePage";
import { InventoryOverviewPage } from "./components/inventory/InventoryOverviewPage";
import { InventoryProductsPage } from "./components/inventory/InventoryProductsPage";
import { PurchaseOrdersPage } from "./components/inventory/PurchaseOrdersPage";
import { SalesOrdersPage } from "./components/inventory/SalesOrdersPage";
import { InventoryAdjustmentsPage } from "./components/inventory/InventoryAdjustmentsPage";
import { InventoryReportsPage } from "./components/inventory/InventoryReportsPage";

export default function App() {
  return (
    <CompanyDataProvider companies={[]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/no-company" element={<NoCompanyAssignedPage />} />

          <Route
            path="/company/:companyId/dashboard"
            element={<LegacyCompanyWorkspaceRedirect />}
          />
          <Route
            path="/company/:companyId"
            element={<LegacyCompanyWorkspaceRedirect />}
          />

          <Route element={<AppLayout />}>
            <Route element={<RequireFinancialModuleAccess />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/export-import" element={<ExportImportPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/accounts-receivable" element={<AccountsReceivablePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/inventory" element={<InventoryOverviewPage />} />
              <Route path="/inventory/products" element={<InventoryProductsPage />} />
              <Route path="/inventory/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/inventory/sales-orders" element={<SalesOrdersPage />} />
              <Route path="/inventory/adjustments" element={<InventoryAdjustmentsPage />} />
              <Route path="/inventory/reports" element={<InventoryReportsPage />} />
            </Route>
          </Route>

          <Route element={<RequireSuperAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/companies" replace />} />
              <Route path="/admin/companies" element={<AdminCompaniesPage />} />
              <Route
                path="/admin/companies/:companyId"
                element={<AdminCompanyDetailsPage />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CompanyDataProvider>
  );
}
