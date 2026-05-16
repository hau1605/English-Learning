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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionAdminApi, lessonAdminApi, Lesson, CreateLessonDto, UpdateLessonDto } from "@/features/admin/api/section-admin.api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
  Gamepad2,
  Target,
  HelpCircle,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";

const LESSON_TYPE_CONFIG = {
  VIDEO: { icon: Video, label: "Video", color: "bg-blue-100 text-blue-700" },
  READING: { icon: FileText, label: "Reading", color: "bg-green-100 text-green-700" },
  INTERACTIVE: { icon: Gamepad2, label: "Interactive", color: "bg-purple-100 text-purple-700" },
  PRACTICE: { icon: Target, label: "Practice", color: "bg-orange-100 text-orange-700" },
  QUIZ: { icon: HelpCircle, label: "Quiz", color: "bg-red-100 text-red-700" },
};

export default function AdminSectionLessonsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [form, setForm] = useState<CreateLessonDto & { sectionId: string }>({
    sectionId,
    title: "",
    description: "",
    type: "READING",
    content: "",
    videoUrl: "",
    estimatedTime: 15,
    orderIndex: 0,
  });

  const { data: section, isLoading: sectionLoading } = useQuery({
    queryKey: ["admin", "sections", sectionId],
    queryFn: () => sectionAdminApi.getSectionById(sectionId),
    enabled: !!sectionId,
  });

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["admin", "lessons", "section", sectionId, { page, search }],
    queryFn: () => lessonAdminApi.getLessonsBySection(sectionId),
    enabled: !!sectionId,
  });

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
      toast.error("Please enter a lesson title");
      return;
    }

    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getLessonTypeIcon = (type: string) => {
    const config = LESSON_TYPE_CONFIG[type as keyof typeof LESSON_TYPE_CONFIG];
    const Icon = config?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getLessonTypeBadgeClass = (type: string) => {
    const config = LESSON_TYPE_CONFIG[type as keyof typeof LESSON_TYPE_CONFIG];
    return config?.color || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/sections">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Sections
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
            <p className="text-muted-foreground">
              {sectionLoading ? (
                <Skeleton className="h-4 w-64 mt-1" />
              ) : (
                `Manage lessons in "${section?.data?.title || 'Section'}"`
              )}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Edit Lesson" : "Create New Lesson"}
              </DialogTitle>
              <DialogDescription>
                {editingLesson
                  ? "Update the lesson details"
                  : "Create a new lesson for this section"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Introduction to English"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this lesson..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, type: value as any }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="READING">Reading</SelectItem>
                      <SelectItem value="INTERACTIVE">Interactive</SelectItem>
                      <SelectItem value="PRACTICE">Practice</SelectItem>
                      <SelectItem value="QUIZ">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    min={1}
                    value={form.estimatedTime}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedTime: parseInt(e.target.value) || 15,
                      }))
                    }
                  />
                </div>
              </div>
              {form.type === "VIDEO" && (
                <div className="grid gap-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    value={form.videoUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              )}
              {(form.type === "READING" || form.type === "INTERACTIVE") && (
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={form.content}
                    onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Lesson content..."
                    className="min-h-[200px]"
                  />
                </div>
              )}
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingLesson(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingLesson ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons ({lessons?.data?.length || 0})</CardTitle>
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
              <div className="space-y-3">
                {lessons?.data?.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <GripVertical className="h-5 w-5 cursor-grab" />
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${getLessonTypeBadgeClass(lesson.type)}`}>
                        {getLessonTypeIcon(lesson.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{lesson.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {lesson.type}
                        </Badge>
                        {lesson.estimatedTime && (
                          <span className="text-xs text-muted-foreground">
                            {lesson.estimatedTime} min
                          </span>
                        )}
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(lesson)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this lesson?")) {
                            deleteMutation.mutate(lesson.id);
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

              {(!lessons?.data || lessons.data.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No lessons found. Create your first lesson to get started.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
