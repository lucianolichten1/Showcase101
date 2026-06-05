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
import { CompanyWorkspacePage } from "./components/company/CompanyWorkspacePage";
import { LoginPage } from "./components/auth/LoginPage";
import { NoCompanyAssignedPage } from "./components/auth/NoCompanyAssignedPage";
import {
  RequireAuth,
  RequireCompanyWorkspaceAccess,
  RequireFinancialModuleAccess,
  RequireSuperAdmin,
  RootRedirect,
} from "./components/auth/RouteGuards";
import { CompanyDataProvider } from "./domains/company/CompanyDataContext";
import { ExpensesPage } from "./components/ExpensesPage";
import { RevenuePage } from "./components/RevenuePage";

export default function App() {
  return (
    <CompanyDataProvider companies={[]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/no-company" element={<NoCompanyAssignedPage />} />

          <Route element={<AppLayout />}>
            <Route element={<RequireFinancialModuleAccess />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/export-import" element={<ExportImportPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/revenue" element={<RevenuePage />} />
              <Route path="/accounts-receivable" element={<AccountsReceivablePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
            </Route>

            <Route element={<RequireCompanyWorkspaceAccess />}>
              <Route
                path="/company/:companyId"
                element={<Navigate to="dashboard" replace />}
              />
              <Route
                path="/company/:companyId/dashboard"
                element={<CompanyWorkspacePage />}
              />
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
