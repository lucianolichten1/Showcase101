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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/export-import" element={<ExportImportPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/accounts-receivable" element={<AccountsReceivablePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route
          path="/admin/companies"
          element={
            <AdminCompaniesPage
              companies={companyRecords}
              onAddCompany={(company) => setCompanyRecords((prev) => [...prev, company])}
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
        <Route
          path="/company/:companyId"
          element={<Navigate to="dashboard" replace />}
        />
        <Route
          path="/company/:companyId/dashboard"
          element={<CompanyWorkspacePage companies={companyRecords} />}
        />
      </Route>
    </Routes>
    </CompanyDataProvider>
  );
}
