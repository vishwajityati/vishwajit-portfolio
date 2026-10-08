import { Plus, Trash2 } from "lucide-react";

interface AdminTextListProps {
  title: string;
  items: string[];
  addLabel: string;
  placeholder: string;
  onChange: (items: string[]) => void;
  multiline?: boolean;
}

export function AdminTextList({
  title,
  items,
  addLabel,
  placeholder,
  onChange,
  multiline = false
}: AdminTextListProps) {
  return (
    <div className="content-list">
      <div className="content-list-heading">
        <div><h3>{title}</h3><p>Add one item per row. Remove rows you no longer need.</p></div>
        <button className="button button-quiet content-add-button" type="button" onClick={() => onChange([...items, ""])}>
          <Plus size={14} />{addLabel}
        </button>
      </div>
      {items.length === 0 ? <p className="content-empty">Nothing added yet.</p> : items.map((item, index) => (
        <div className="content-list-row" key={`${title}-${index}`}>
          <label className="sr-only" htmlFor={`${title}-${index}`}>{`${title} ${index + 1}`}</label>
          {multiline ? (
            <textarea id={`${title}-${index}`} rows={4} value={item} placeholder={placeholder} onChange={(event) => onChange(items.map((current, itemIndex) => itemIndex === index ? event.target.value : current))} />
          ) : (
            <input id={`${title}-${index}`} value={item} placeholder={placeholder} onChange={(event) => onChange(items.map((current, itemIndex) => itemIndex === index ? event.target.value : current))} />
          )}
          <button className="content-icon-button" type="button" aria-label={`Remove ${title.toLowerCase()} ${index + 1}`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
