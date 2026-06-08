import { Search } from "lucide-react";

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdminSearch({
  value,
  onChange,
  placeholder = "Search companies, owners, niches…",
}: AdminSearchProps) {
  return (
    <div className="admin-search">
      <Search className="h-[17px] w-[17px] shrink-0 text-[var(--admin-ink-4)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
