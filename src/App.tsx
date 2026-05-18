/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";
import { AccountsReceivablePage } from "./components/AccountsReceivablePage";
import type { NavItemId } from "./config/navigation";

export default function App() {
  const [activeNavId, setActiveNavId] = useState<NavItemId>("dashboard");

  return (
    <AppLayout activeNavId={activeNavId} onNavChange={setActiveNavId}>
      {activeNavId === "dashboard" && <DashboardPage />}
      {activeNavId === "accounts-receivable" && <AccountsReceivablePage />}
    </AppLayout>
  );
}
