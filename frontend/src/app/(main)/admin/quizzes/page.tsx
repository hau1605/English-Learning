"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  quizAdminApi,
  Quiz,
  CreateQuizDto,
  UpdateQuizDto,
} from "@/features/admin/api/quiz-admin.api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ScrollText,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { QUIZ_TYPE_LABELS } from "@/shared/types";
import { QuizType } from "@/shared/enums";

export default function AdminQuizzesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [published, setPublished] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const [form, setForm] = useState<CreateQuizDto>({
    title: "",
    description: "",
    type: "MULTIPLE_CHOICE" as QuizType,
    passingScore: 70,
    durationSeconds: 600,
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["admin", "quizzes", "list", { page, search, type, published }],
    queryFn: () =>
      quizAdminApi.getQuizzes({
        page,
        limit: 20,
        search: search || undefined,
        type: type ? (type as QuizType) : undefined,
        published:
          published === "true"
            ? true
            : published === "false"
              ? false
              : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateQuizDto) => quizAdminApi.createQuiz(data),
    onSuccess: () => {
      toast.success("Quiz created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "quizzes", "list"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create quiz");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuizDto }) =>
      quizAdminApi.updateQuiz(id, data),
    onSuccess: () => {
      toast.success("Quiz updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "quizzes", "list"] });
      setIsDialogOpen(false);
      setEditingQuiz(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update quiz");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizAdminApi.deleteQuiz(id),
    onSuccess: () => {
      toast.success("Quiz deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "quizzes", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete quiz");
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      quizAdminApi.updateQuiz(id, { publishedAt: published }),
    onSuccess: () => {
      toast.success("Quiz publish status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "quizzes", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update quiz");
    },
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "MULTIPLE_CHOICE" as QuizType,
      passingScore: 70,
      durationSeconds: 600,
    });
  };

  const openEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description || "",
      type: quiz.type,
      passingScore: quiz.passingScore,
      durationSeconds: quiz.durationSeconds || 600,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingQuiz) {
      updateMutation.mutate({ id: editingQuiz.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
          <p className="text-muted-foreground">
            Create and manage quizzes for your learning platform
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingQuiz ? "Edit Quiz" : "Create New Quiz"}
              </DialogTitle>
              <DialogDescription>
                {editingQuiz
                  ? "Update the quiz details"
                  : "Create a new quiz for your learners"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Basic Vocabulary Quiz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of this quiz..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, type: value as QuizType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="FILL_BLANK">
                        Fill in the Blank
                      </SelectItem>
                      <SelectItem value="MATCHING">Matching</SelectItem>
                      <SelectItem value="SPEAKING">Speaking</SelectItem>
                      <SelectItem value="MIXED">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min={0}
                    max={100}
                    value={form.passingScore}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        passingScore: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  value={form.durationSeconds}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      durationSeconds: parseInt(e.target.value),
                    }))
                  }
                  placeholder="600"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingQuiz(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingQuiz ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search quizzes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={type || "all"} onValueChange={(value) => setType(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">
                    Multiple Choice
                  </SelectItem>
                  <SelectItem value="FILL_BLANK">Fill in the Blank</SelectItem>
                  <SelectItem value="MATCHING">Matching</SelectItem>
                  <SelectItem value="SPEAKING">Speaking</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={published || "all"} onValueChange={(value) => setPublished(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Published</SelectItem>
                  <SelectItem value="false">Unpublished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quizzes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quizzes ({quizzes?.meta?.total || 0})</CardTitle>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">
                          Title
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Questions
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Attempts
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes?.data?.map((quiz) => (
                        <tr
                          key={quiz.id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{quiz.title}</p>
                              {quiz.description && (
                                <p className="text-sm text-muted-foreground max-w-xs truncate">
                                  {quiz.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">
                              {QUIZ_TYPE_LABELS[quiz.type] || quiz.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">
                              {quiz._count?.questions || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">
                              {quiz._count?.attempts || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {quiz.publishedAt ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  togglePublishMutation.mutate({
                                    id: quiz.id,
                                    published: !quiz.publishedAt,
                                  })
                                }
                                title={
                                  quiz.publishedAt ? "Unpublish" : "Publish"
                                }
                              >
                                {quiz.publishedAt ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(quiz)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this quiz?",
                                    )
                                  ) {
                                    deleteMutation.mutate(quiz.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(quizzes?.meta?.page ?? 1) * (quizzes?.meta?.limit ?? 20) - (quizzes?.meta?.limit ?? 20) + 1} - {Math.min((quizzes?.meta?.page ?? 1) * (quizzes?.meta?.limit ?? 20), quizzes?.meta?.total ?? 0)} of {quizzes?.meta?.total ?? 0} quizzes (Page {page} of {quizzes?.meta?.totalPages || 1})
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
                      disabled={
                        page >= (quizzes?.meta?.totalPages || 1)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {(!quizzes?.data || quizzes.data.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No quizzes found
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
