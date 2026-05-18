/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";
import { ExportImportPage } from "./components/ExportImportPage";
 feature/accounts-recievable-ui
import { AccountsReceivablePage } from "./components/AccountsReceivablePage";
import type { NavItemId } from "./config/navigation";

type ActivePage = "dashboard" | "export-import" | "accounts-receivable";

const navigablePages: ActivePage[] = ["dashboard", "export-import", "accounts-receivable"];
=======
import type { NavItemId } from "./config/navigation";

type ActivePage = "dashboard" | "export-import";

const navigablePages: ActivePage[] = ["dashboard", "export-import"];
 main

function isNavigablePage(id: NavItemId): id is ActivePage {
  return navigablePages.includes(id as ActivePage);
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");

  const handleNavigate = (id: NavItemId) => {
    if (isNavigablePage(id)) {
      setActivePage(id);
    }
  };

  return (
    <AppLayout activeNavId={activePage} onNavigate={handleNavigate}>
 feature/accounts-recievable-ui
      {activePage === "dashboard" && <DashboardPage />}
      {activePage === "export-import" && <ExportImportPage />}
      {activePage === "accounts-receivable" && <AccountsReceivablePage />}
=======
      {activePage === "dashboard" ? <DashboardPage /> : <ExportImportPage />}
 main
    </AppLayout>
  );
}
