"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sectionAdminApi,
  Section,
  CreateSectionDto,
  UpdateSectionDto,
} from "@/features/admin/api/section-admin.api";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/admin-data-table";

const sectionCode = (item: Section, index: number) =>
  `SEC-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

export default function AdminSectionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [courseId, setCourseId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [form, setForm] = useState<CreateSectionDto>({
    courseId: "",
    title: "",
    description: "",
    orderIndex: 0,
  });

  const { data: sections, isLoading } = useQuery({
    queryKey: ["admin", "sections", "list", { page, limit, courseId }],
    queryFn: () =>
      sectionAdminApi.getSections({
        page,
        limit,
        courseId: courseId || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSectionDto) => sectionAdminApi.createSection(data),
    onSuccess: () => {
      toast.success("Section created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections", "list"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create section");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSectionDto }) =>
      sectionAdminApi.updateSection(id, data),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections", "list"] });
      setIsDialogOpen(false);
      setEditingSection(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update section");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sectionAdminApi.deleteSection(id),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete section");
    },
  });

  const resetForm = () => {
    setForm({
      courseId: "",
      title: "",
      description: "",
      orderIndex: 0,
    });
  };

  const openEdit = (section: Section) => {
    setEditingSection(section);
    setForm({
      courseId: section.courseId,
      title: section.title,
      description: section.description || "",
      orderIndex: section.orderIndex,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.courseId.trim()) {
      toast.error("Please enter courseId");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Please enter title");
      return;
    }

    if (editingSection) {
      updateMutation.mutate({
        id: editingSection.id,
        data: {
          title: form.title,
          description: form.description,
          orderIndex: form.orderIndex,
        },
      });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <AdminDataTable
      title="Quan ly sections"
      data={sections?.data || []}
      isLoading={isLoading}
      total={sections?.meta?.total || 0}
      page={page}
      pageSize={limit}
      totalPages={sections?.meta?.totalPages || 1}
      onPageChange={setPage}
      onPageSizeChange={(nextLimit) => {
        setPage(1);
        setLimit(nextLimit);
      }}
      getCode={sectionCode}
      getTitle={(item) => item.title}
      minWidth={1050}
      columns={[
        { key: "course", header: "Course", render: (item) => item.course?.title || item.courseId, className: "max-w-[180px] truncate" },
        { key: "title", header: "Title", render: (item) => item.title, className: "min-w-[220px]" },
        { key: "description", header: "Description", render: (item) => item.description || "---", className: "max-w-[280px] truncate" },
        { key: "orderIndex", header: "Order index", render: (item) => item.orderIndex },
        { key: "createdAt", header: "Created at", render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN") },
        { key: "updatedAt", header: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN") },
      ]}
      detailFields={[
        { label: "ID", render: (item) => item.id },
        { label: "Course", render: (item) => item.course?.title || item.courseId },
        { label: "Title", render: (item) => item.title },
        { label: "Description", render: (item) => item.description },
        { label: "Order index", render: (item) => item.orderIndex },
        { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
        { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
      ]}
      toolbar={
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative">
            <Input
              value={courseId}
              onChange={(event) => { setPage(1); setCourseId(event.target.value); }}
              className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background lg:w-[300px]"
              placeholder="Loc theo course..."
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800">
                <Plus className="h-4 w-4" />
                Them moi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>{editingSection ? "Edit Section" : "Create Section"}</DialogTitle>
                <DialogDescription>Cap nhat du lieu dung cac cot trong bang course_sections.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Course</Label>
                  <Input value={form.courseId} disabled={!!editingSection} onChange={(event) => setForm((prev) => ({ ...prev, courseId: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea value={form.description || ""} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Order index</Label>
                  <Input type="number" value={form.orderIndex || 0} onChange={(event) => setForm((prev) => ({ ...prev, orderIndex: parseInt(event.target.value) || 0 }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingSection(null); resetForm(); }}>Huy</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingSection ? "Cap nhat" : "Tao moi"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
      onEdit={openEdit}
      onDelete={(item) => {
        if (confirm("Xoa section nay?")) deleteMutation.mutate(item.id);
      }}
    />
  );
}
