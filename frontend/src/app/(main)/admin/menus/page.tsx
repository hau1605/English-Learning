'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MenuItem, MenuRole, menuApi, CreateMenuItemDto, UpdateMenuItemDto } from '@/features/menu/api/menu.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  GripVertical,
  ChevronUp,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const iconOptions = [
  'LayoutDashboard',
  'GraduationCap',
  'BookOpen',
  'ScrollText',
  'Mic',
  'Sparkles',
  'Trophy',
  'BarChart3',
  'Shield',
  'Users',
  'Settings',
  'Menu',
  'FileText',
  'Bell',
  'Search',
  'Filter',
  'Home',
  'User',
  'Calendar',
  'Clock',
];

interface MenuTreeItemProps {
  item: MenuItem;
  level: number;
  allItems: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggle: (item: MenuItem) => void;
  onMoveUp: (item: MenuItem) => void;
  onMoveDown: (item: MenuItem, siblings: MenuItem[]) => void;
}

function MenuTreeItem({
  item,
  level,
  allItems,
  onEdit,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}: MenuTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const children = allItems.filter((i) => i.parentId === item.id);
  const hasChildren = children.length > 0;

  const siblings = allItems.filter((i) => i.parentId === item.parentId);
  const currentIndex = siblings.findIndex((i) => i.id === item.id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === siblings.length - 1;

  return (
    <>
      <tr className={`border-b ${!item.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2" style={{ marginLeft: level * 24 }}>
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            {hasChildren ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <span className="font-medium">{item.label}</span>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-gray-500">{item.code}</td>
        <td className="py-3 px-4 text-sm text-gray-500">{item.path}</td>
        <td className="py-3 px-4">
          <div className="flex gap-1">
            {item.roles.slice(0, 3).map((role) => (
              <Badge key={role.id} variant="secondary" className="text-xs">
                {role.code}
              </Badge>
            ))}
            {item.roles.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.roles.length - 3}
              </Badge>
            )}
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMoveUp(item)}
              disabled={isFirst}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => onMoveDown(item, siblings)}
              disabled={isLast}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
              title="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </td>
        <td className="py-3 px-4">
          <Switch
            checked={item.isActive}
            onCheckedChange={() => onToggle(item)}
          />
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
      {isOpen && hasChildren && (
        <>
          {children
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((child) => (
              <MenuTreeItem
                key={child.id}
                item={child}
                level={level + 1}
                allItems={allItems}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            ))}
        </>
      )}
    </>
  );
}

export default function AdminMenusPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<MenuRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CreateMenuItemDto>({
    code: '',
    label: '',
    icon: '',
    path: '',
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
      setMenuItems(menuResponse.data);
      setRoles(rolesResponse.data);
    } catch (error) {
      toast.error('Failed to load menu data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rootItems = menuItems.filter((item) => !item.parentId);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      label: item.label,
      icon: item.icon || '',
      path: item.path,
      orderIndex: item.orderIndex,
      parentId: item.parentId || undefined,
      isActive: item.isActive,
      roleCodes: item.roles.map((r) => r.code),
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      label: '',
      icon: '',
      path: '/',
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
        toast.success('Menu item updated');
      } else {
        await menuApi.createMenuItem(formData);
        toast.success('Menu item created');
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.label}"?`)) return;
    try {
      await menuApi.deleteMenuItem(item.id);
      toast.success('Menu item deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggle = async (item: MenuItem) => {
    try {
      await menuApi.updateMenuItem(item.id, { isActive: !item.isActive });
      toast.success(`Menu item ${!item.isActive ? 'enabled' : 'disabled'}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  const handleMoveUp = async (item: MenuItem) => {
    const siblings = menuItems.filter((i) => i.parentId === item.parentId);
    const currentIndex = siblings.findIndex((i) => i.id === item.id);
    if (currentIndex <= 0) return;

    const prevItem = siblings[currentIndex - 1];
    try {
      await menuApi.reorderMenus([
        { id: item.id, orderIndex: prevItem.orderIndex, parentId: item.parentId || undefined },
        { id: prevItem.id, orderIndex: item.orderIndex, parentId: prevItem.parentId || undefined },
      ]);
      loadData();
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const handleMoveDown = async (item: MenuItem, siblings: MenuItem[]) => {
    const currentIndex = siblings.findIndex((i) => i.id === item.id);
    if (currentIndex >= siblings.length - 1) return;

    const nextItem = siblings[currentIndex + 1];
    try {
      await menuApi.reorderMenus([
        { id: item.id, orderIndex: nextItem.orderIndex, parentId: item.parentId || undefined },
        { id: nextItem.id, orderIndex: item.orderIndex, parentId: nextItem.parentId || undefined },
      ]);
      loadData();
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const handleRoleToggle = (roleCode: string) => {
    setFormData((prev) => ({
      ...prev,
      roleCodes: prev.roleCodes?.includes(roleCode)
        ? prev.roleCodes.filter((r) => r !== roleCode)
        : [...(prev.roleCodes || []), roleCode],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Configure sidebar menus and their access permissions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-3 px-4 text-left text-sm font-medium">Label</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Code</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Path</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Roles</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Order</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Active</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rootItems
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((item) => (
                  <MenuTreeItem
                    key={item.id}
                    item={item}
                    level={0}
                    allItems={menuItems}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              {rootItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No menu items found. Create your first menu item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Create Menu Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Menu Label"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="menu-code"
                  disabled={!!editingItem}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Path</label>
                <Input
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/path"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  <option value="">No Icon</option>
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Parent Menu</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, parentId: e.target.value || undefined })
                  }
                >
                  <option value="">No Parent (Root)</option>
                  {menuItems
                    .filter((item) => !item.parentId && item.id !== editingItem?.id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Input
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) =>
                    setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role Access</label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.roleCodes?.includes(role.code) || false}
                      onChange={() => handleRoleToggle(role.code)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to allow all roles
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
