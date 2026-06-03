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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  lessonAdminApi,
  Lesson,
  CreateLessonDto,
  UpdateLessonDto,
} from "@/features/admin/api/section-admin.api";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { AdminDataTable } from "@/components/admin/admin-data-table";

const lessonCode = (item: Lesson, index: number) =>
  `LES-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

const lessonTypeOptions = [
  { value: "VIDEO", label: "VIDEO" },
  { value: "READING", label: "READING" },
  { value: "INTERACTIVE", label: "INTERACTIVE" },
  { value: "PRACTICE", label: "PRACTICE" },
];

export default function AdminSectionLessonsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState<CreateLessonDto>({
    sectionId,
    title: "",
    description: "",
    type: "READING",
    content: "",
    videoUrl: "",
    estimatedTime: 15,
    orderIndex: 0,
  });

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["admin", "lessons", "section", sectionId, { search }],
    queryFn: () => lessonAdminApi.getLessonsBySection(sectionId),
    enabled: !!sectionId,
  });

  const filteredLessons = (lessons?.data || []).filter((lesson) =>
    `${lesson.title} ${lesson.description || ""} ${lesson.type}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: (data: CreateLessonDto) => lessonAdminApi.createLesson(data),
    onSuccess: () => {
      toast.success("Lesson created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons", "section", sectionId] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create lesson");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonDto }) =>
      lessonAdminApi.updateLesson(id, data),
    onSuccess: () => {
      toast.success("Lesson updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons", "section", sectionId] });
      setIsDialogOpen(false);
      setEditingLesson(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update lesson");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lessonAdminApi.deleteLesson(id),
    onSuccess: () => {
      toast.success("Lesson deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons", "section", sectionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete lesson");
    },
  });

  const resetForm = () => {
    setForm({
      sectionId,
      title: "",
      description: "",
      type: "READING",
      content: "",
      videoUrl: "",
      estimatedTime: 15,
      orderIndex: lessons?.data?.length || 0,
    });
  };

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setForm({
      sectionId,
      title: lesson.title,
      description: lesson.description || "",
      type: lesson.type,
      content: lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      estimatedTime: lesson.estimatedTime || 15,
      orderIndex: lesson.orderIndex,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Please enter lesson title");
      return;
    }
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <AdminDataTable
      title="Quản lý lessons"
      data={filteredLessons}
      isLoading={isLoading}
      total={filteredLessons.length}
      page={page}
      totalPages={1}
      onPageChange={setPage}
      getCode={lessonCode}
      getTitle={(item) => item.title}
      minWidth={1180}
      columns={[
        { key: "section", header: "Section", render: (item) => item.section?.title || item.sectionId, className: "max-w-[180px] truncate" },
        { key: "title", header: "Title", render: (item) => item.title, className: "min-w-[220px]" },
        { key: "description", header: "Description", render: (item) => item.description || "---", className: "max-w-[240px] truncate" },
        { key: "type", header: "Type", render: (item) => item.type },
        { key: "content", header: "Content", render: (item) => item.content || "---", className: "max-w-[220px] truncate" },
        { key: "videoUrl", header: "Video URL", render: (item) => item.videoUrl || "---", className: "max-w-[180px] truncate" },
        { key: "estimatedTime", header: "Estimated time", render: (item) => item.estimatedTime ?? "---" },
        { key: "orderIndex", header: "Order index", render: (item) => item.orderIndex },
        { key: "createdAt", header: "Created at", render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN") },
        { key: "updatedAt", header: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN") },
      ]}
      detailFields={[
        { label: "ID", render: (item) => item.id },
        { label: "Section", render: (item) => item.section?.title || item.sectionId },
        { label: "Title", render: (item) => item.title },
        { label: "Description", render: (item) => item.description },
        { label: "Type", render: (item) => item.type },
        { label: "Content", render: (item) => item.content },
        { label: "Video URL", render: (item) => item.videoUrl },
        { label: "Estimated time", render: (item) => item.estimatedTime },
        { label: "Order index", render: (item) => item.orderIndex },
        { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
        { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
      ]}
      toolbar={
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background lg:w-[280px]" placeholder="Tìm theo từ khóa..." />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Them moi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingLesson ? "Edit Lesson" : "Create Lesson"}</DialogTitle>
                <DialogDescription>Cap nhat du lieu dung cac cot trong bang lessons.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea value={form.description || ""} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <SearchableSelect
                      value={form.type}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as any }))}
                      options={lessonTypeOptions}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Estimated time</Label>
                    <Input type="number" value={form.estimatedTime || ""} onChange={(event) => setForm((prev) => ({ ...prev, estimatedTime: parseInt(event.target.value) || undefined }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Order index</Label>
                    <Input type="number" value={form.orderIndex || 0} onChange={(event) => setForm((prev) => ({ ...prev, orderIndex: parseInt(event.target.value) || 0 }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Video URL</Label>
                    <Input value={form.videoUrl || ""} onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Content</Label>
                  <Textarea className="min-h-[160px]" value={form.content || ""} onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingLesson(null); resetForm(); }}>Huy</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingLesson ? "Cap nhat" : "Tao moi"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
      onEdit={openEdit}
      onDelete={(item) => {
        if (confirm("Xoa lesson nay?")) deleteMutation.mutate(item.id);
      }}
    />
  );
}
