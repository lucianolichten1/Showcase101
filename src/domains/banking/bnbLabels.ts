import type { BnbErrorCode } from "./bnbTypes";

export const BNB_BANK_NAME = "Banco Nacional de Bolivia";

export const BNB_COPY = {
  connect: "Conectar con BNB",
  connectTitle: "Conectar cuentas BNB",
  connectDescription:
    "Seleccione las cuentas de Banco Nacional de Bolivia que desea importar o actualizar en Rojas-Data.",
  sandboxBadge: "Modo prueba",
  sync: "Sincronizar",
  syncing: "Sincronizando…",
  connected: "Conectada a BNB",
  manual: "Gestión manual",
  lastSynced: (when: string) => `Sincronizado ${when}`,
  syncedNow: "Sincronizado",
  importSelected: "Importar seleccionadas",
  cancel: "Cancelar",
  noAccountsFound: "No se encontraron cuentas en BNB.",
  selectAtLeastOne: "Seleccione al menos una cuenta.",
  accountTypeChecking: "Cuenta corriente",
  accountTypeSavings: "Cuenta de ahorros",
  credentialsHint:
    "Configura tus credenciales BNB en el archivo .env.local para conectar con el banco en vivo.",
  credentialsLink: "Ver configuración",
} as const;

export function bnbErrorMessage(code: BnbErrorCode): string {
  switch (code) {
    case "not_configured":
      return BNB_COPY.credentialsHint;
    case "network":
      return "No se pudo conectar con BNB. Intente de nuevo.";
    case "invalid_credentials":
      return "Credenciales BNB inválidas. Verifica tu configuración.";
    default:
      return "Ocurrió un error al conectar con BNB.";
  }
}
