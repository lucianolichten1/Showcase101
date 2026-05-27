/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";
import { ExportImportPage } from "./components/ExportImportPage";
import { AccountsReceivablePage } from "./components/AccountsReceivablePage";
import { ReportsPage } from "./components/ReportsPage";
import { CustomersPage } from "./components/CustomersPage";
import { AdminCompaniesPage } from "./components/admin/AdminCompaniesPage";
import { AdminCompanyDetailsPage } from "./components/admin/AdminCompanyDetailsPage";
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
import { initialCompanies } from "./domains/admin/mockData";
import type { CompanyRecord } from "./domains/admin/types";

export default function App() {
  const [companyRecords, setCompanyRecords] = useState<CompanyRecord[]>(initialCompanies);

  return (
    <CompanyDataProvider companies={companyRecords}>
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

            <Route element={<RequireSuperAdmin />}>
              <Route path="/admin" element={<Navigate to="/admin/companies" replace />} />
              <Route
                path="/admin/companies"
                element={
                  <AdminCompaniesPage
                    companies={companyRecords}
                    onAddCompany={(company) =>
                      setCompanyRecords((prev) => [...prev, company])
                    }
                  />
                }
              />
              <Route
                path="/admin/companies/:companyId"
                element={
                  <AdminCompanyDetailsPage
                    companies={companyRecords}
                    onUpdateCompany={(updated) =>
                      setCompanyRecords((prev) =>
                        prev.map((c) => (c.id === updated.id ? updated : c))
                      )
                    }
                  />
                }
              />
            </Route>

            <Route element={<RequireCompanyWorkspaceAccess />}>
              <Route
                path="/company/:companyId"
                element={<Navigate to="dashboard" replace />}
              />
              <Route
                path="/company/:companyId/dashboard"
                element={<CompanyWorkspacePage companies={companyRecords} />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CompanyDataProvider>
  );
}
