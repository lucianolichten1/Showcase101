export type BnbErrorCode =
  | "not_configured"
  | "network"
  | "invalid_credentials"
  | "unknown";

export type BnbAccountTypeCode = 1 | 2;

export interface BnbAccountBalance {
  accountNumber: string;
  accountType: BnbAccountTypeCode;
  currency: string;
  balanceAmount: number;
  partyName: string;
}

export type BnbResult<T> =
  | { ok: true; data: T; sandbox: boolean }
  | { ok: false; error: BnbErrorCode; message: string };
