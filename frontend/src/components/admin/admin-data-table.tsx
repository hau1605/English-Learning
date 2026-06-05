"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/utils";
import { Edit3, Trash2 } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

type PaginationItem = number | "ellipsis";

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  width?: string;
  tooltip?: (item: T, index: number) => ReactNode;
  render: (item: T, index: number) => ReactNode;
}

export interface AdminDetailField<T> {
  label: string;
  render: (item: T) => ReactNode;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  onClick: (item: T) => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
}

interface AdminDataTableProps<T extends { id: string }> {
  title: string;
  data: T[];
  columns: AdminTableColumn<T>[];
  detailFields: AdminDetailField<T>[];
  getCode: (item: T, index: number) => string;
  getTitle?: (item: T) => string;
  isLoading?: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  minWidth?: number;
  emptyText?: string;
  toolbar?: ReactNode;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  extraActions?: TableAction<T>[];
}

function renderDetailValue(value: ReactNode) {
  if (value === null || value === undefined || value === "") return "---";
  if (typeof value === "object" && !Array.isArray(value)) return value;
  return value;
}

function isPlainCellValue(value: ReactNode) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint"
  );
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    // currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    // currentPage + 2,
    "ellipsis",
    totalPages,
  ];
}

function TruncatedCellContent({
  children,
  tooltip,
}: {
  children: ReactNode;
  tooltip?: ReactNode;
}) {
  const tooltipValue =
    tooltip ?? (isPlainCellValue(children) ? children : null);

  if (!tooltipValue) {
    return <div className="min-w-0 truncate">{children}</div>;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className="min-w-0 truncate">{children}</div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="center"
            sideOffset={8}
            className="z-[100] max-w-[360px] rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium leading-5 text-white shadow-lg"
          >
            {tooltipValue}
            <TooltipPrimitive.Arrow className="fill-neutral-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export function AdminDataTable<T extends { id: string }>({
  title,
  data,
  columns,
  detailFields,
  getCode,
  getTitle,
  isLoading = false,
  total = data.length,
  page = 1,
  totalPages = 1,
  pageSize = 10,
  pageSizeOptions = [1, 3, 5, 10, 20, 50, 100, 200],
  minWidth = 1200,
  emptyText = "Không có dữ liệu",
  toolbar,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  extraActions,
}: AdminDataTableProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);
  const usesExternalPaging = Boolean(onPageChange && onPageSizeChange);
  const currentPage = usesExternalPaging ? page : internalPage;
  const currentPageSize = usesExternalPaging ? pageSize : internalPageSize;
  const currentTotalPages = usesExternalPaging
    ? totalPages
    : Math.max(1, Math.ceil(total / currentPageSize));
  const visibleData = usesExternalPaging
    ? data
    : data.slice(
        (currentPage - 1) * currentPageSize,
        currentPage * currentPageSize,
      );
  const visiblePages = useMemo(
    () => getPaginationItems(currentPage, currentTotalPages || 1),
    [currentPage, currentTotalPages],
  );

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), currentTotalPages || 1);

    if (usesExternalPaging) {
      onPageChange?.(boundedPage);
      return;
    }

    setInternalPage(boundedPage);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    if (usesExternalPaging) {
      onPageSizeChange?.(nextPageSize);
      return;
    }

    setInternalPage(1);
    setInternalPageSize(nextPageSize);
  };

  return (
    <div className="flex h-[calc(100vh-110px)] min-h-[640px] flex-col">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-950 dark:text-foreground">
            {title}
          </h1>
        </div>
        {toolbar}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden border border-slate-200 bg-white dark:border-border dark:bg-card">
        <div className="h-full overflow-auto">
          <table
            className="w-full table-fixed border-collapse text-xs"
            style={{ minWidth }}
          >
            <colgroup>
              <col style={{ width: 100 }} />
              {columns.map((column) => (
                <col
                  key={column.key}
                  style={{ width: column.width || "180px" }}
                />
              ))}
              <col style={{ width: 104 }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-slate-50 text-slate-700 dark:bg-muted dark:text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-30 h-10 w-[116px] whitespace-nowrap border-b border-r border-slate-200 bg-slate-50 px-3 text-left font-medium dark:border-border dark:bg-muted">
                  Mã
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "h-8 whitespace-nowrap border-b border-r border-slate-200 px-3 text-left font-medium last:border-r-0 dark:border-border",
                      column.className,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
                <th className="sticky right-0 z-30 h-10 w-[104px] whitespace-nowrap border-b border-l border-slate-200 bg-slate-50 px-3 text-left font-medium dark:border-border dark:bg-muted">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, index) => (
                  <tr
                    key={`loading-${index}`}
                    className="h-10 border-b border-slate-100 dark:border-border"
                  >
                    <td colSpan={columns.length + 2} className="px-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}

              {!isLoading &&
                visibleData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="h-8 border-b border-slate-100 hover:bg-blue-50/40 dark:border-border dark:hover:bg-muted/40"
                  >
                    <td className="sticky left-0 z-10 max-w-0 whitespace-nowrap border-r border-slate-100 bg-white px-3 font-medium text-blue-700 dark:border-border dark:bg-card dark:text-primary">
                      <button
                        type="button"
                        className="block max-w-full truncate underline-offset-2 hover:underline"
                        onClick={() => setSelectedItem(item)}
                      >
                        {getCode(item, index)}
                      </button>
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "max-w-0 border-r border-slate-100 px-2 dark:border-border",
                          column.className,
                        )}
                      >
                        <TruncatedCellContent
                          tooltip={column.tooltip?.(item, index)}
                        >
                          {column.render(item, index)}
                        </TruncatedCellContent>
                      </td>
                    ))}
                    <td className="sticky right-0 z-10 whitespace-nowrap border-l border-slate-100 bg-white px-3 dark:border-border dark:bg-card">
                      <div className="flex items-center gap-2">
                        {extraActions?.map((action, idx) => {
                          const Icon = action.icon;
                          return (
                            <Button
                              key={idx}
                              variant={action.variant === "destructive" ? "outline" : "ghost"}
                              className={cn(
                                "h-5 w-7 rounded border-slate-200 bg-slate-50 p-0 dark:border-border dark:bg-background",
                                action.variant === "destructive" && "text-red-600 dark:text-red-400"
                              )}
                              onClick={() => action.onClick(item)}
                              aria-label={action.label}
                            >
                              {Icon ? (
                                <Icon
                                  aria-hidden="true"
                                  className="block h-3.5 w-3.5 shrink-0 text-slate-700 dark:text-slate-200"
                                  strokeWidth={2.25}
                                />
                              ) : (
                                <span className="text-xs">{action.label}</span>
                              )}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          className="h-7 w-7 rounded border-slate-200 bg-slate-50 p-0 dark:border-border dark:bg-background"
                          onClick={() => onEdit(item)}
                          aria-label="Cập nhật"
                        >
                          <Edit3
                            aria-hidden="true"
                            className="block h-3.5 w-3.5 shrink-0 text-slate-700 dark:text-slate-200"
                            strokeWidth={2.25}
                          />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-7 w-7 rounded border-slate-200 bg-slate-50 p-0 text-red-600 dark:border-border dark:bg-background"
                          onClick={() => onDelete(item)}
                          aria-label="Xóa"
                        >
                          <Trash2
                            aria-hidden="true"
                            className="block h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400"
                            strokeWidth={2.25}
                          />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && visibleData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="h-48 text-center text-sm text-slate-500"
                  >
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground">
        <span>Tổng số lượng: {total}</span>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            className="h-8 w-8 rounded border-0 bg-transparent p-0 text-slate-900 shadow-none hover:bg-slate-100 hover:text-slate-950 disabled:bg-transparent disabled:text-slate-300 dark:text-slate-100 dark:hover:bg-muted dark:hover:text-white dark:disabled:text-slate-600"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Trang trước"
          >
            <span aria-hidden="true" className="text-lg font-bold leading-none">
              ‹
            </span>
          </Button>
          {visiblePages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 min-w-8 items-center justify-center text-xs text-slate-400"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => handlePageChange(item)}
                className={cn(
                  "h-8 min-w-8 rounded border px-2 text-xs",
                  currentPage === item
                    ? "border-blue-600 bg-white text-blue-700 dark:bg-background"
                    : "border-transparent text-slate-600",
                )}
              >
                {item}
              </button>
            ),
          )}
          <Button
            variant="ghost"
            className="h-8 w-8 rounded border-0 bg-transparent p-0 text-slate-900 shadow-none hover:bg-slate-100 hover:text-slate-950 disabled:bg-transparent disabled:text-slate-300 dark:text-slate-100 dark:hover:bg-muted dark:hover:text-white dark:disabled:text-slate-600"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= (currentTotalPages || 1)}
            aria-label="Trang sau"
          >
            <span aria-hidden="true" className="text-lg font-bold leading-none">
              ›
            </span>
          </Button>
          <SearchableSelect
            value={String(currentPageSize)}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
            className="h-8 w-[118px] rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background"
            options={pageSizeOptions.map((option) => ({
              value: String(option),
              label: `${option} / trang`,
            }))}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem
                ? getTitle?.(selectedItem) || getCode(selectedItem, 0)
                : "Chi tiết"}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 p-3 dark:border-border">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Mã
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-blue-700 dark:text-primary">
                  {getCode(selectedItem, 0)}
                </p>
              </div>
              {detailFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-md border border-slate-200 p-3 dark:border-border"
                >
                  <p className="text-xs font-medium uppercase text-slate-500">
                    {field.label}
                  </p>
                  <div className="mt-1 break-words text-sm">
                    {renderDetailValue(field.render(selectedItem))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
