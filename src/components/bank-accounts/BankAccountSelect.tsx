import type { BankAccountRecord } from "@/domains/financial/bank-accounts/types";
import { maskAccountNumber } from "@/domains/financial/bank-accounts/labels";

interface Props {
  id?: string;
  label: string;
  placeholder: string;
  value: string | null | undefined;
  accounts: BankAccountRecord[];
  required?: boolean;
  onChange: (bankAccountId: string | null) => void;
}

export function BankAccountSelect({
  id,
  label,
  placeholder,
  value,
  accounts,
  required = false,
  onChange,
}: Props) {
  const activeAccounts = accounts.filter((a) => a.active);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase text-green-800 mb-1"
      >
        {label}
      </label>
      <select
        id={id}
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full py-2 px-3 text-xs border border-stone-200 rounded-lg"
      >
        <option value="">{placeholder}</option>
        {activeAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.accountName}
            {account.bankName ? ` · ${account.bankName}` : ""}
            {account.accountNumber ? ` (${maskAccountNumber(account.accountNumber)})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
