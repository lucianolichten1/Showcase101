import type { BnbErrorCode, BnbResult } from "./bnbTypes";

const BNB_SANDBOX_BASE_URL = "http://test.bnb.com.bo";
const BNB_TOKEN_URL = `${BNB_SANDBOX_BASE_URL}/ClientAuthentication.API/api/v1/auth/token`;
const BNB_UPDATE_CREDENTIALS_URL =
  `${BNB_SANDBOX_BASE_URL}/ClientAuthentication.API/api/v1/auth/UpdateCredentials`;
const BNB_GENERATE_QR_URL =
  `${BNB_SANDBOX_BASE_URL}/QRSimple.API/api/v1/main/getQRWithImageAsync`;
const BNB_QR_STATUS_URL =
  `${BNB_SANDBOX_BASE_URL}/QRSimple.API/api/v1/main/getQRStatusAsync`;
const BNB_CANCEL_QR_URL =
  `${BNB_SANDBOX_BASE_URL}/QRSimple.API/api/v1/main/CancelQRByIdAsync`;

const TOKEN_TTL_MS = 50 * 60 * 1000;
const UPDATED_CREDENTIALS_FLAG = "bnb-updated-credentials-v1";

let cachedToken: { value: string; expiresAt: number } | null = null;

export interface GenerateQrInput {
  invoiceId: number;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  expirationDateIso: string;
  destinationAccountId?: string;
}

export interface BnbQrPayload {
  qrId: string;
  qrImageBase64: string;
}

export interface BnbQrStatusPayload {
  statusId: 1 | 2 | 3 | 4;
}

function readCredential(name: "VITE_BNB_ACCOUNT_ID" | "VITE_BNB_AUTHORIZATION_ID"): string {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function fail<T>(error: BnbErrorCode, message: string): BnbResult<T> {
  return { ok: false, error, message };
}

function succeed<T>(data: T): BnbResult<T> {
  return { ok: true, data, sandbox: false };
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore persistence failures.
  }
}

function parseToken(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  const token = record.token ?? record.accessToken ?? record.access_token;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

function parseQrId(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  const id = record.id ?? record.qrId ?? record.QRId;
  if (typeof id === "number") return String(id);
  if (typeof id === "string" && id.trim()) return id.trim();
  return null;
}

function parseQrImageBase64(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  const qr = record.qr ?? record.qrImage ?? record.image;

  if (typeof qr === "string" && qr.trim()) {
    return qr.trim();
  }
  if (Array.isArray(qr)) {
    const bytes = qr
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item >= 0 && item <= 255);
    if (bytes.length === 0) return null;
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
  }
  return null;
}

function parseQrStatusId(json: unknown): 1 | 2 | 3 | 4 | null {
  if (!json || typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  const value = Number(record.statusId ?? record.status ?? record.stateId);
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return null;
}

function buildGloss(invoiceNumber: string, clientName: string): string {
  return `Pago factura ${invoiceNumber} - ${clientName}`.slice(0, 100);
}

async function fetchAuthToken(): Promise<BnbResult<string>> {
  const accountId = readCredential("VITE_BNB_ACCOUNT_ID");
  const authorizationId = readCredential("VITE_BNB_AUTHORIZATION_ID");
  if (!accountId || !authorizationId) {
    return fail("not_configured", "BNB credentials are not configured");
  }

  try {
    const response = await fetch(BNB_TOKEN_URL, {
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
    const token = parseToken(json);
    if (!token) return fail("unknown", "BNB auth response missing token");

    cachedToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
    return succeed(token);
  } catch {
    return fail("network", "BNB auth network error");
  }
}

async function ensureValidToken(): Promise<BnbResult<string>> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return succeed(cachedToken.value);
  }
  return fetchAuthToken();
}

async function ensureUpdatedCredentials(token: string): Promise<BnbResult<true>> {
  if (safeLocalStorageGet(UPDATED_CREDENTIALS_FLAG) === "done") {
    return succeed(true);
  }

  const accountId = readCredential("VITE_BNB_ACCOUNT_ID");
  const authorizationId = readCredential("VITE_BNB_AUTHORIZATION_ID");
  const newAuthorizationId = `${authorizationId}!A1`;

  try {
    const response = await fetch(BNB_UPDATE_CREDENTIALS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        accountId,
        authorizationId,
        newAuthorizationId,
      }),
    });

    if (!response.ok && response.status !== 409) {
      return fail("credential_update_failed", "Unable to update BNB credentials");
    }
    safeLocalStorageSet(UPDATED_CREDENTIALS_FLAG, "done");
    return succeed(true);
  } catch {
    return fail("network", "BNB credential update network error");
  }
}

async function withTokenAndCredentials<T>(
  task: (token: string) => Promise<BnbResult<T>>
): Promise<BnbResult<T>> {
  const tokenResult = await ensureValidToken();
  if (tokenResult.ok === false) {
    return fail(tokenResult.error, tokenResult.message);
  }
  const updated = await ensureUpdatedCredentials(tokenResult.data);
  if (updated.ok === false) {
    return fail(updated.error, updated.message);
  }
  return task(tokenResult.data);
}

export async function generateInvoiceQr(
  input: GenerateQrInput
): Promise<BnbResult<BnbQrPayload>> {
  return withTokenAndCredentials(async (token) => {
    try {
      const response = await fetch(BNB_GENERATE_QR_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          currency: "BOB",
          gloss: buildGloss(input.invoiceNumber, input.clientName),
          amount: Number(input.amount.toFixed(2)),
          singleUse: true,
          expirationDate: input.expirationDateIso,
          additionalData: String(input.invoiceId),
          destinationAccountId: input.destinationAccountId ?? "1",
        }),
      });

      if (!response.ok) {
        return fail("qr_generation_failed", `QR generation failed (${response.status})`);
      }
      const json: unknown = await response.json();
      const qrId = parseQrId(json);
      const qrImageBase64 = parseQrImageBase64(json);
      if (!qrId || !qrImageBase64) {
        return fail("qr_generation_failed", "QR response missing id/image");
      }
      return succeed({ qrId, qrImageBase64 });
    } catch {
      return fail("network", "BNB QR network error");
    }
  });
}

export async function getBnbQrStatus(qrId: string): Promise<BnbResult<BnbQrStatusPayload>> {
  return withTokenAndCredentials(async (token) => {
    try {
      const response = await fetch(BNB_QR_STATUS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ qrId }),
      });
      if (!response.ok) {
        return fail("network", `QR status failed (${response.status})`);
      }
      const json: unknown = await response.json();
      const statusId = parseQrStatusId(json);
      if (!statusId) return fail("unknown", "QR status response invalid");
      if (statusId === 3) return fail("qr_expired", "QR expired");
      return succeed({ statusId });
    } catch {
      return fail("network", "QR status network error");
    }
  });
}

export async function cancelBnbQr(qrId: string): Promise<BnbResult<true>> {
  return withTokenAndCredentials(async (token) => {
    try {
      const response = await fetch(BNB_CANCEL_QR_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ qrId }),
      });
      if (!response.ok) {
        return fail("network", `QR cancel failed (${response.status})`);
      }
      return succeed(true);
    } catch {
      return fail("network", "QR cancel network error");
    }
  });
}
