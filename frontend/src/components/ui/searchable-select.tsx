"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyText?: string;
  selectedLabel?: string;
  shouldFilter?: boolean;
  onSearchChange?: (search: string) => void;
  renderOption?: (option: SearchableSelectOption, selected: boolean) => React.ReactNode;
}

export function SearchableSelect({
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  className,
  disabled,
  loading,
  emptyText = "No options found.",
  selectedLabel,
  shouldFilter = true,
  onSearchChange,
  renderOption,
}: SearchableSelectProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);
  const currentLabel = selectedLabel ?? selectedOption?.label ?? "";
  const normalizedSearch = search.trim().toLowerCase();
  const visibleOptions =
    shouldFilter && normalizedSearch
      ? options.filter((option) =>
          `${option.label} ${option.searchText || ""}`.toLowerCase().includes(normalizedSearch),
        )
      : options;

  const close = React.useCallback(() => {
    setOpen(false);
    setSearch("");
    onSearchChange?.("");
  }, [onSearchChange]);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [close, open]);

  return (
    <div ref={rootRef} className="relative">
      <Input
        value={open ? search : currentLabel}
        onChange={(event) => {
          const nextSearch = event.target.value;
          setSearch(nextSearch);
          setOpen(true);
          onSearchChange?.(nextSearch);
        }}
        onFocus={() => {
          setSearch("");
          setOpen(true);
          onSearchChange?.("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.blur();
            close();
          }
        }}
        disabled={disabled}
        className={cn("pr-9", className)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
      />
      {open && search ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            setSearch("");
            onSearchChange?.("");
          }}
          disabled={disabled}
          aria-label="Clear select search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : visibleOptions.length ? (
              visibleOptions.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => {
                      onValueChange(option.value);
                      close();
                    }}
                  >
                    <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0 flex-1 truncate">
                      {renderOption ? renderOption(option, selected) : option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
