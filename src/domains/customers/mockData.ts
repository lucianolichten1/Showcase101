import type { CustomerRecord } from "./types";

/**
 * Initial customer records — used as fallback when no customers have been imported.
 * These mirror the legacy mockData customers but use the new CustomerRecord shape
 * (no totalInvoiced / totalPaid — those are computed from receivable records).
 */
export const initialCustomerRecords: CustomerRecord[] = [
  {
    id: 1,
    name: "Cliente Santa Cruz",
    email: "contacto@santacruz.bo",
    phone: "+591 3 333-1001",
    city: "Santa Cruz",
    industry: "Retail",
    status: "Active",
    createdAt: "2026-01-01",
  },
  {
    id: 2,
    name: "Distribuidora Norte",
    email: "ventas@distrnorte.bo",
    phone: "+591 3 333-1002",
    city: "Trinidad",
    industry: "Distribution",
    status: "Active",
    createdAt: "2026-01-01",
  },
  {
    id: 3,
    name: "Mercado Central",
    email: "admin@mercadocentral.bo",
    phone: "+591 3 333-1003",
    city: "Cochabamba",
    industry: "Retail",
    status: "Active",
    createdAt: "2026-01-01",
  },
  {
    id: 4,
    name: "Agro Bolivia SRL",
    email: "info@agrobolivia.bo",
    phone: "+591 2 222-1004",
    city: "La Paz",
    industry: "Agriculture",
    status: "Active",
    createdAt: "2026-01-01",
  },
  {
    id: 5,
    name: "Finca El Palmar",
    email: "finca@elpalmar.bo",
    phone: "+591 3 333-1005",
    city: "Santa Cruz",
    industry: "Agriculture",
    status: "Active",
    createdAt: "2026-01-01",
  },
  {
    id: 6,
    name: "Hacienda San Miguel",
    email: "contacto@sanmiguel.bo",
    phone: "+591 3 333-1006",
    city: "Beni",
    industry: "Agriculture",
    status: "Active",
    createdAt: "2026-01-01",
  },
  {
    id: 7,
    name: "Exportadora Oriente",
    email: "export@oriente.bo",
    phone: "+591 3 333-1007",
    city: "Santa Cruz",
    industry: "Export",
    status: "Active",
    createdAt: "2026-01-01",
  },
  {
    id: 8,
    name: "Cooperativa Yungas",
    email: "coop@yungas.bo",
    phone: "+591 2 222-1008",
    city: "La Paz",
    industry: "Agriculture",
    status: "Inactive",
    createdAt: "2026-01-01",
  },
];
