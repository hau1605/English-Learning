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
import { sectionAdminApi, Section, UpdateSectionDto } from "@/features/admin/api/section-admin.api";
import {
  Edit2,
  Trash2,
  ChevronLeft,
  BookOpen,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function AdminSectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.sectionId as string;
  
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [form, setForm] = useState<UpdateSectionDto>({
    title: "",
    description: "",
    orderIndex: 0,
  });

  const { data: section, isLoading, error } = useQuery({
    queryKey: ["admin", "sections", sectionId],
    queryFn: () => sectionAdminApi.getSectionById(sectionId),
    enabled: !!sectionId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSectionDto) => sectionAdminApi.updateSection(sectionId, data),
    onSuccess: () => {
      toast.success("Section updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections", sectionId] });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update section");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => sectionAdminApi.deleteSection(sectionId),
    onSuccess: () => {
      toast.success("Section deleted successfully");
      router.push("/admin/sections");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete section");
    },
  });

  const handleEditOpen = () => {
    if (section?.data) {
      setForm({
        title: section.data.title,
        description: section.data.description || "",
        orderIndex: section.data.orderIndex,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdate = () => {
    if (!form.title?.trim()) {
      toast.error("Please enter a section title");
      return;
    }
    updateMutation.mutate(form);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this section? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold text-destructive">Section not found</h2>
        <p className="text-muted-foreground mt-2">The section you're looking for doesn't exist.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/sections")}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Sections
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/sections">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Sections
            </Link>
          </Button>
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48 mt-2" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">{section?.data?.title}</h1>
                  <Badge variant="secondary">Order: {section?.data?.orderIndex}</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Course ID: {section?.data?.courseId}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleEditOpen} disabled={isLoading}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/sections/${sectionId}/lessons`}>
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Lessons
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Update the section details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Chapter 1: Introduction"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this section..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-order">Order Index</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setForm((prev) => ({ ...prev, orderIndex: Math.max(0, (prev.orderIndex || 0) - 1) }))}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Input
                  id="edit-order"
                  type="number"
                  min={0}
                  value={form.orderIndex}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))
                  }
                  className="w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setForm((prev) => ({ ...prev, orderIndex: (prev.orderIndex || 0) + 1 }))}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="mt-1">{section?.data?.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="mt-1">
                    {section?.data?.description || "No description provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order</p>
                  <p className="mt-1">#{section?.data?.orderIndex}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lessons ({section?.data?.lessons?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : section?.data?.lessons?.length ? (
              <div className="space-y-2">
                {section.data.lessons.map((lesson: any, index: number) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center justify-center w-6 h-6 text-xs font-medium bg-muted rounded-full">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">{lesson.type}</p>
                    </div>
                    <Badge variant="outline">{lesson.estimatedTime || 0} min</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No lessons in this section yet.</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href={`/admin/sections/${sectionId}/lessons`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lessons
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
