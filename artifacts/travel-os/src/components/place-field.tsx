import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchPlaces } from "@workspace/api-client-react";
import type { PlaceSearchResultPlacesItem } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export type Place = PlaceSearchResultPlacesItem;

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

export function PlaceField({
  place, onSelect, placeholder, className,
}: {
  place: Place | null;
  onSelect: (p: Place | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(place?.label ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    setText(place?.label ?? "");
  }, [place?.label]);

  const debounced = useDebounce(text, 300);
  const enabled = debounced.trim().length >= 2 && (!place || place.label !== debounced);
  const { data, isFetching } = useSearchPlaces(
    { q: debounced.trim() },
    { query: { enabled } as any },
  );
  const results = data?.places ?? [];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => setHighlight(0), [results.length]);

  const choose = (p: Place) => {
    onSelect(p);
    setText(p.label);
    setOpen(false);
  };

  const showList = open && results.length > 0;
  const showLoading = open && isFetching && enabled && results.length === 0;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (results[highlight]) {
        e.preventDefault();
        choose(results[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={text}
          placeholder={placeholder}
          autoComplete="off"
          className={cn("h-12 rounded-xl bg-white", className)}
          onChange={(e) => {
            setText(e.target.value);
            if (place) onSelect(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {isFetching && enabled && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {(showList || showLoading) && (
        <ul className="absolute z-[1000] mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg text-left">
          {showLoading ? (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> Searching places…
            </li>
          ) : (
            results.map((p, i) => (
              <li
                key={`${p.label}-${p.lat}-${p.lng}`}
                onMouseDown={(e) => { e.preventDefault(); choose(p); }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                  i === highlight ? "bg-accent text-accent-foreground" : "text-foreground",
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{p.label}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
