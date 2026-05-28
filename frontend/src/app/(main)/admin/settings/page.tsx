"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateSystemSetting,
  useDeleteSystemSetting,
  useSystemSettings,
  useUpdateSystemSetting,
  SystemSettingRow,
} from "@/features/admin/hooks/use-admin.hook";
import { Plus, Search } from "lucide-react";
import { AdminDataTable } from "@/components/admin/admin-data-table";

const settingCode = (item: SystemSettingRow, index: number) =>
  `SET-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

const emptyCreateForm = {
  key: "",
  value: "",
  type: "string",
  category: "general",
  isPublic: false,
};

export default function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSettingRow | null>(null);
  const [value, setValue] = useState("");
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const { data: settings, isLoading } = useSystemSettings();
  const createMutation = useCreateSystemSetting();
  const updateMutation = useUpdateSystemSetting();
  const deleteMutation = useDeleteSystemSetting();

  useEffect(() => {
    setMounted(true);
  }, []);

  const rows = settings?.data || [];
  const filteredRows = rows.filter((item) =>
    `${item.key} ${item.value} ${item.type} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const openEdit = (setting: SystemSettingRow) => {
    setEditingSetting(setting);
    setValue(setting.value);
  };

  const handleSave = () => {
    if (!editingSetting) return;
    updateMutation.mutate(
      { key: editingSetting.key, value },
      {
        onSuccess: () => {
          setEditingSetting(null);
          setValue("");
        },
      },
    );
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        key: createForm.key.trim(),
        value: createForm.value,
        type: createForm.type,
        category: createForm.category.trim() || "general",
        isPublic: createForm.isPublic,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setCreateForm(emptyCreateForm);
        },
      },
    );
  };

  return (
    <>
      <AdminDataTable
        title="Quan ly settings"
        data={filteredRows}
        isLoading={!mounted || isLoading}
        total={filteredRows.length}
        page={1}
        totalPages={1}
        getCode={settingCode}
        getTitle={(item) => item.key}
        minWidth={1120}
        columns={[
          { key: "key", header: "Key", render: (item) => item.key, className: "min-w-[220px]" },
          { key: "value", header: "Value", render: (item) => item.value, className: "max-w-[320px] truncate" },
          { key: "type", header: "Type", render: (item) => item.type },
          { key: "category", header: "Category", render: (item) => item.category },
          { key: "isPublic", header: "Public", render: (item) => item.isPublic ? "Yes" : "No" },
          { key: "createdAt", header: "Created at", render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN") },
          { key: "updatedAt", header: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN") },
        ]}
        detailFields={[
          { label: "ID", render: (item) => item.id },
          { label: "Key", render: (item) => item.key },
          { label: "Value", render: (item) => item.value },
          { label: "Type", render: (item) => item.type },
          { label: "Category", render: (item) => item.category },
          { label: "Public", render: (item) => String(item.isPublic) },
          { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
          { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
        ]}
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background lg:w-[300px]" placeholder="Tim theo tu khoa..." />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Button
              className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Them moi
            </Button>
          </div>
        }
        onEdit={openEdit}
        onDelete={(item) => {
          if (confirm(`Xoa setting "${item.key}"?`)) deleteMutation.mutate(item.key);
        }}
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Them setting</DialogTitle>
            <DialogDescription>Tao moi mot dong trong system_settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="setting-key">Key</Label>
              <Input
                id="setting-key"
                value={createForm.key}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    key: event.target.value,
                  }))
                }
                placeholder="site.title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="setting-value">Value</Label>
              <Input
                id="setting-value"
                value={createForm.value}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    value: event.target.value,
                  }))
                }
                placeholder="English Learning Platform"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="setting-type">Type</Label>
                <select
                  id="setting-type"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={createForm.type}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="json">json</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="setting-category">Category</Label>
                <Input
                  id="setting-category"
                  value={createForm.category}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder="general"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={createForm.isPublic}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    isPublic: event.target.checked,
                  }))
                }
              />
              Public
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Huy</Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !createForm.key.trim()}
            >
              {createMutation.isPending ? "Dang luu..." : "Them moi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSetting} onOpenChange={(open) => !open && setEditingSetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cap nhat setting</DialogTitle>
            <DialogDescription>Chi cap nhat cot value cua system_settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Key</Label>
              <Input value={editingSetting?.key || ""} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Value</Label>
              <Input value={value} onChange={(event) => setValue(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSetting(null)}>Huy</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>Cap nhat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
