interface AdminFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}

export function AdminField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  multiline = false,
}: AdminFieldProps) {
  return (
    <label className={multiline ? "content-field content-field-wide" : "content-field"}>
      {multiline ? (
        <textarea rows={3} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          type={type}
        />
      )}
    </label>
  );
}
