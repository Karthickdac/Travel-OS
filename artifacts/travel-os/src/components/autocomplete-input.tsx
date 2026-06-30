import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  maxResults?: number;
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
  maxResults = 8,
}: AutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const query = value.trim().toLowerCase();
  const filtered = (
    query
      ? suggestions.filter((s) => s.toLowerCase().includes(query))
      : suggestions
  ).slice(0, maxResults);

  // Hide the list when an exact match is already typed.
  const exact = suggestions.some((s) => s.toLowerCase() === query) && filtered.length <= 1;
  const showList = open && filtered.length > 0 && !exact;

  // Keep the highlighted index within the current result set.
  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close when focus leaves the component entirely (e.g. Tab to next field).
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  const choose = (s: string) => {
    onChange(s);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[highlight]) {
        e.preventDefault();
        choose(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative" onBlur={onBlur}>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-activedescendant={showList ? `${listId}-opt-${highlight}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                i === highlight ? "bg-accent text-accent-foreground" : "text-foreground",
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
