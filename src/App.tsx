/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";
import { ExportImportPage } from "./components/ExportImportPage";
import type { NavItemId } from "./config/navigation";

type ActivePage = "dashboard" | "export-import";

const navigablePages: ActivePage[] = ["dashboard", "export-import"];

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
      {activePage === "dashboard" ? <DashboardPage /> : <ExportImportPage />}
    </AppLayout>
  );
}
