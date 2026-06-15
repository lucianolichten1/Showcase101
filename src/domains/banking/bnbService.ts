import type { BankAccountType } from "@/domains/financial/bank-accounts/types";
import type { CurrencyCode } from "@/domains/financial/types";
import type { BnbAccountBalance, BnbAccountTypeCode, BnbErrorCode, BnbResult } from "./bnbTypes";
import { BNB_COPY } from "./bnbLabels";

const BNB_AUTH_URL =
  "https://clientauthenticationapiv2.azurewebsites.net/api/v1/auth/token";
const BNB_BALANCE_URL =
  "https://accountapiv1.azurewebsites.net/api/v1/Transactions/getBalanceAsync";

const TOKEN_TTL_MS = 50 * 60 * 1000;

let cachedToken: { value: string; expiresAt: number } | null = null;

function readCredential(name: "VITE_BNB_ACCOUNT_ID" | "VITE_BNB_AUTHORIZATION_ID"): string {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function isBnbConfigured(): boolean {
  return Boolean(readCredential("VITE_BNB_ACCOUNT_ID") && readCredential("VITE_BNB_AUTHORIZATION_ID"));
}

export function isBnbSandboxMode(): boolean {
  return !isBnbConfigured();
}

function fail<T>(error: BnbErrorCode, message: string): BnbResult<T> {
  return { ok: false, error, message };
}

function succeed<T>(data: T, sandbox: boolean): BnbResult<T> {
  return { ok: true, data, sandbox };
}

function getMockBalances(): BnbAccountBalance[] {
  return [
    {
      accountNumber: "1500123456789012",
      accountType: 1,
      currency: "BOB",
      balanceAmount: 48_750.35,
      partyName: "Empresa Demo S.R.L.",
    },
    {
      accountNumber: "1500987654321098",
      accountType: 2,
      currency: "BOB",
      balanceAmount: 125_400.0,
      partyName: "Empresa Demo S.R.L.",
    },
  ];
}

function parseTokenPayload(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  const candidates = [record.token, record.accessToken, record.access_token];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseBalanceList(json: unknown): BnbAccountBalance[] | null {
  if (!json) return null;

  const rawList = Array.isArray(json)
    ? json
    : typeof json === "object" && Array.isArray((json as Record<string, unknown>).data)
      ? ((json as Record<string, unknown>).data as unknown[])
      : typeof json === "object" && Array.isArray((json as Record<string, unknown>).accounts)
        ? ((json as Record<string, unknown>).accounts as unknown[])
        : null;

  if (!rawList) return null;

  const parsed: BnbAccountBalance[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const accountNumber = String(row.accountNumber ?? row.account_number ?? "").trim();
    const accountType = Number(row.accountType ?? row.account_type);
    const currency = String(row.currency ?? "BOB").trim();
    const balanceAmount = Number(row.balanceAmount ?? row.balance_amount ?? row.balance);
    const partyName = String(row.partyName ?? row.party_name ?? "Cuenta BNB").trim();
    if (!accountNumber || !Number.isFinite(balanceAmount)) continue;
    if (accountType !== 1 && accountType !== 2) continue;
    parsed.push({
      accountNumber,
      accountType: accountType as BnbAccountTypeCode,
      currency,
      balanceAmount,
      partyName,
    });
  }

  return parsed.length > 0 ? parsed : null;
}

async function fetchAuthToken(): Promise<BnbResult<string>> {
  const accountId = readCredential("VITE_BNB_ACCOUNT_ID");
  const authorizationId = readCredential("VITE_BNB_AUTHORIZATION_ID");

  if (!accountId || !authorizationId) {
    return fail("not_configured", "BNB credentials are not configured");
  }

  try {
    const response = await fetch(BNB_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ accountId, authorizationId }),
    });

    if (response.status === 401 || response.status === 403) {
      cachedToken = null;
      return fail("invalid_credentials", "Invalid BNB credentials");
    }

    if (!response.ok) {
      return fail("network", `BNB auth failed (${response.status})`);
    }

    const json: unknown = await response.json();
    const token = parseTokenPayload(json);
    if (!token) {
      return fail("unknown", "BNB auth response missing token");
    }

    cachedToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
    return succeed(token, false);
  } catch {
    return fail("network", "BNB auth network error");
  }
}

async function getValidToken(): Promise<BnbResult<string>> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return succeed(cachedToken.value, false);
  }
  return fetchAuthToken();
}

export async function getAccountBalances(): Promise<BnbResult<BnbAccountBalance[]>> {
  if (!isBnbConfigured()) {
    return succeed(getMockBalances(), true);
  }

  const tokenResult = await getValidToken();
  if (tokenResult.ok === false) {
    return fail(tokenResult.error, tokenResult.message);
  }

  try {
    const response = await fetch(BNB_BALANCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.data}`,
        Accept: "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      cachedToken = null;
      const retry = await fetchAuthToken();
      if (retry.ok === false) {
        return fail(retry.error, retry.message);
      }
      return getAccountBalances();
    }

    if (!response.ok) {
      return fail("network", `BNB balance request failed (${response.status})`);
    }

    const json: unknown = await response.json();
    const accounts = parseBalanceList(json);
    if (!accounts) {
      return fail("unknown", "Unexpected BNB balance response");
    }

    return succeed(accounts, false);
  } catch {
    return fail("network", "BNB balance network error");
  }
}

export function mapBnbAccountType(type: BnbAccountTypeCode): BankAccountType {
  return type === 2 ? "Ahorros" : "Corriente";
}

export function mapBnbCurrency(currency: string): CurrencyCode {
  const normalized = currency.trim().toUpperCase();
  if (normalized === "BOB" || normalized === "BS") return "Bs";
  if (normalized === "USD") return "USD";
  return "Bs";
}

export function bnbAccountTypeLabel(type: BnbAccountTypeCode): string {
  return type === 2 ? BNB_COPY.accountTypeSavings : BNB_COPY.accountTypeChecking;
}

export function maskBnbAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length < 4) return "—";
  return `****${digits.slice(-4)}`;
}

export function formatBnbLastSynced(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
