/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./components/DashboardPage";

export default function App() {
  return (
    <AppLayout activeNavId="dashboard">
      <DashboardPage />
    </AppLayout>
  );
}
