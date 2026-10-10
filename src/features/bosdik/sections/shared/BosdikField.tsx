interface BosdikFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}

export function BosdikField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  multiline = false,
}: BosdikFieldProps) {
  return (
    <label className={multiline ? "content-field content-field-wide" : "content-field"}>
      <span className="content-field-label">{label}</span>
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
