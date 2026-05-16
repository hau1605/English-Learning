"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { sectionAdminApi, Section, CreateSectionDto, UpdateSectionDto } from "@/features/admin/api/section-admin.api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminSectionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [courseId, setCourseId] = useState("");

  const [form, setForm] = useState<CreateSectionDto>({
    courseId: "",
    title: "",
    description: "",
    orderIndex: 0,
  });

  const { data: sections, isLoading } = useQuery({
    queryKey: ["admin", "sections", "list", { page, search }],
    queryFn: () => sectionAdminApi.getSections({ page, limit: 20 }),
    enabled: !!courseId,
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
    if (!form.courseId) {
      toast.error("Please enter a course ID");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Please enter a section title");
      return;
    }

    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Section Management</h1>
          <p className="text-muted-foreground">
            Create and manage course sections
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Section
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? "Edit Section" : "Create New Section"}
              </DialogTitle>
              <DialogDescription>
                {editingSection
                  ? "Update the section details"
                  : "Create a new section for your course"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="courseId">Course ID</Label>
                <Input
                  id="courseId"
                  value={form.courseId}
                  onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
                  placeholder="Enter course ID"
                  disabled={!!editingSection}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Chapter 1: Introduction"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief description of this section..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="orderIndex">Order Index</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  min={0}
                  value={form.orderIndex}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingSection(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingSection ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Filter by Course ID..."
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full md:w-[250px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle>Sections ({sections?.meta?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {sections?.data?.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{section.title}</h3>
                        <Badge variant="secondary">Order: {section.orderIndex}</Badge>
                      </div>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {section.lessons?.length || 0} lessons
                        </span>
                        <span>Course ID: {section.courseId}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/sections/${section.id}/lessons`}>
                          Manage Lessons
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(section)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this section?")) {
                            deleteMutation.mutate(section.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(sections?.meta?.page ?? 1) * (sections?.meta?.limit ?? 20) - (sections?.meta?.limit ?? 20) + 1} - {Math.min((sections?.meta?.page ?? 1) * (sections?.meta?.limit ?? 20), sections?.meta?.total ?? 0)} of {sections?.meta?.total ?? 0} sections (Page {page} of {sections?.meta?.totalPages || 1})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (sections?.meta?.totalPages || 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {(!sections?.data || sections.data.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  {courseId ? "No sections found" : "Enter a Course ID to view sections"}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
