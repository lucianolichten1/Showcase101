interface AdminSegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

export function AdminSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: AdminSegmentedControlProps<T>) {
  return (
    <div className="admin-seg">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={value === option ? "on" : ""}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
