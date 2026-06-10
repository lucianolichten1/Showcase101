import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AuthProvider } from "./domains/auth/AuthContext.tsx";
import { FinancialDataProvider } from "./domains/financial/FinancialDataContext.tsx";
import { InventoryDataProvider } from "./domains/inventory/InventoryDataContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FinancialDataProvider>
          <InventoryDataProvider>
            <App />
          </InventoryDataProvider>
        </FinancialDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
