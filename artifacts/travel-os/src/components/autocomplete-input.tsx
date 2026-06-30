import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  maxResults?: number;
  /**
   * Optional async source (e.g. a geocoding proxy). When provided, its results
   * take priority; the static `suggestions` list is used as a fallback when it
   * returns nothing or is still loading. Pass a stable (module-level) function.
   */
  fetchSuggestions?: (query: string) => Promise<string[]>;
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
  maxResults = 8,
  fetchSuggestions,
}: AutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [remote, setRemote] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const query = value.trim().toLowerCase();
  const staticFiltered = (
    query ? suggestions.filter((s) => s.toLowerCase().includes(query)) : suggestions
  ).slice(0, maxResults);

  // Remote results win when available; otherwise fall back to the static list.
  const list = remote.length > 0 ? remote : staticFiltered;

  // Hide the list when the typed value already exactly matches the only option.
  const exact = list.length === 1 && list[0].toLowerCase() === query;
  const showList = open && list.length > 0 && !exact;
  const showLoading = open && loading && list.length === 0 && query.length >= 2;

  // Debounced remote lookup. Remote results are cleared on every keystroke so
  // stale suggestions from a previous query can never override the current one.
  useEffect(() => {
    if (!fetchSuggestions) return;
    const q = value.trim();
    setRemote([]);
    if (q.length < 2) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(q);
        if (active) setRemote(results);
      } catch {
        if (active) setRemote([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [value, fetchSuggestions]);

  // Keep the highlighted index within the current result set.
  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(list.length - 1, 0)));
  }, [list.length]);

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
      setHighlight((h) => Math.min(h + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (list[highlight]) {
        e.preventDefault();
        choose(list[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative" onBlur={onBlur}>
      <div className="relative">
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
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {(showList || showLoading) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {showLoading ? (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              Searching cities…
            </li>
          ) : (
            list.map((s, i) => (
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
            ))
          )}
        </ul>
      )}
    </div>
  );
}
