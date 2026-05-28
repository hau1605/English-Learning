"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  MenuItem,
  MenuRole,
  menuApi,
  CreateMenuItemDto,
} from "@/features/menu/api/menu.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { AdminDataTable } from "@/components/admin/admin-data-table";

const iconOptions = [
  "LayoutDashboard",
  "GraduationCap",
  "BookOpen",
  "ScrollText",
  "Mic",
  "Sparkles",
  "Trophy",
  "BarChart3",
  "Shield",
  "Users",
  "Settings",
  "Menu",
  "FileText",
  "Bell",
  "Search",
  "Filter",
  "Home",
  "User",
  "Calendar",
  "Clock",
];

const menuCode = (item: MenuItem, index: number) =>
  `MENU-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

function flattenMenu(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...flattenMenu(item.children || [])]);
}

export default function AdminMenusPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<MenuRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CreateMenuItemDto>({
    code: "",
    label: "",
    icon: "",
    path: "",
    orderIndex: 0,
    parentId: undefined,
    isActive: true,
    roleCodes: [],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [menuResponse, rolesResponse] = await Promise.all([
        menuApi.getMenuTree(),
        menuApi.getAllRoles(),
      ]);
      setMenuItems(flattenMenu(menuResponse.data));
      setRoles(rolesResponse.data);
    } catch {
      toast.error("Failed to load menu data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = menuItems.filter((item) =>
    `${item.code} ${item.label} ${item.path} ${item.icon || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      label: item.label,
      icon: item.icon || "",
      path: item.path,
      orderIndex: item.orderIndex,
      parentId: item.parentId || undefined,
      isActive: item.isActive,
      roleCodes: item.roles.map((role) => role.code),
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      code: "",
      label: "",
      icon: "",
      path: "/",
      orderIndex: 0,
      parentId: undefined,
      isActive: true,
      roleCodes: [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await menuApi.updateMenuItem(editingItem.id, formData);
        toast.success("Menu item updated");
      } else {
        await menuApi.createMenuItem(formData);
        toast.success("Menu item created");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save menu item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Xoa "${item.label}"?`)) return;
    try {
      await menuApi.deleteMenuItem(item.id);
      toast.success("Menu item deleted");
      loadData();
    } catch {
      toast.error("Failed to delete menu item");
    }
  };

  const handleRoleToggle = (roleCode: string) => {
    setFormData((prev) => ({
      ...prev,
      roleCodes: prev.roleCodes?.includes(roleCode)
        ? prev.roleCodes.filter((role) => role !== roleCode)
        : [...(prev.roleCodes || []), roleCode],
    }));
  };

  return (
    <AdminDataTable
      title="Quan ly menu"
      data={filteredItems}
      isLoading={isLoading}
      total={filteredItems.length}
      page={1}
      totalPages={1}
      getCode={menuCode}
      getTitle={(item) => item.label}
      minWidth={1240}
      columns={[
        { key: "code", header: "Code", render: (item) => item.code, className: "min-w-[170px]" },
        { key: "label", header: "Label", render: (item) => item.label, className: "min-w-[180px]" },
        { key: "icon", header: "Icon", render: (item) => item.icon || "---" },
        { key: "path", header: "Path", render: (item) => item.path, className: "min-w-[180px]" },
        { key: "orderIndex", header: "Order index", render: (item) => item.orderIndex },
        { key: "parent", header: "Parent", render: (item) => item.parent?.label || item.parentId || "---", className: "max-w-[170px] truncate" },
        { key: "isActive", header: "Active", render: (item) => item.isActive ? "Yes" : "No" },
        { key: "createdAt", header: "Created at", render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN") },
        { key: "updatedAt", header: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN") },
      ]}
      detailFields={[
        { label: "ID", render: (item) => item.id },
        { label: "Code", render: (item) => item.code },
        { label: "Label", render: (item) => item.label },
        { label: "Icon", render: (item) => item.icon },
        { label: "Path", render: (item) => item.path },
        { label: "Order index", render: (item) => item.orderIndex },
        { label: "Parent", render: (item) => item.parent?.label || item.parentId },
        { label: "Active", render: (item) => String(item.isActive) },
        { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
        { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
      ]}
      toolbar={
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background lg:w-[280px]" placeholder="Tim theo tu khoa..." />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                Them moi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Menu Item" : "Create Menu Item"}</DialogTitle>
                <DialogDescription>Cap nhat du lieu dung cac cot trong bang menu_items.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Code</Label>
                    <Input value={formData.code} onChange={(event) => setFormData({ ...formData, code: event.target.value })} disabled={!!editingItem} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Label</Label>
                    <Input value={formData.label} onChange={(event) => setFormData({ ...formData, label: event.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Path</Label>
                    <Input value={formData.path} onChange={(event) => setFormData({ ...formData, path: event.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Icon</Label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={formData.icon} onChange={(event) => setFormData({ ...formData, icon: event.target.value })}>
                      <option value="">No icon</option>
                      {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Parent</Label>
                    <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={formData.parentId || ""} onChange={(event) => setFormData({ ...formData, parentId: event.target.value || undefined })}>
                      <option value="">No parent</option>
                      {menuItems.filter((item) => item.id !== editingItem?.id).map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Order index</Label>
                    <Input type="number" value={formData.orderIndex} onChange={(event) => setFormData({ ...formData, orderIndex: parseInt(event.target.value) || 0 })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={formData.isActive} onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })} />
                  Active
                </label>
                <div className="grid gap-2">
                  <Label>Role access</Label>
                  <div className="flex flex-wrap gap-3 rounded-md border p-3">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={formData.roleCodes?.includes(role.code) || false} onChange={() => handleRoleToggle(role.code)} />
                        {role.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Huy</Button>
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Dang luu..." : "Luu"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
