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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flashcardAdminApi,
  Flashcard,
  CreateFlashcardDto,
  UpdateFlashcardDto,
} from "@/features/admin/api/flashcard-admin.api";
import { vocabularyApi, Topic } from "@/features/admin/api/vocabulary.api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminFlashcardsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(
    null,
  );

  const [form, setForm] = useState<CreateFlashcardDto>({
    vocabularyId: "",
    frontContent: "",
    backContent: "",
    hint: "",
  });

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ["admin", "flashcards", "list", { page, search, topicId }],
    queryFn: () =>
      flashcardAdminApi.getFlashcards({
        page,
        limit: 20,
        search: search || undefined,
        topicId: topicId === "all" ? undefined : topicId || undefined,
      }),
  });

  const { data: topics } = useQuery({
    queryKey: ["admin", "vocabulary", "topics"],
    queryFn: vocabularyApi.getTopicsAdmin,
  });

  const { data: vocabularies, isLoading: isLoadingVocabularies } = useQuery({
    queryKey: ["admin", "vocabulary", "list"],
    queryFn: () => vocabularyApi.getVocabulariesAdmin({ limit: 100 }),
    enabled: isDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFlashcardDto) =>
      flashcardAdminApi.createFlashcard(data),
    onSuccess: () => {
      toast.success("Flashcard created successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "flashcards", "list"],
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create flashcard",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlashcardDto }) =>
      flashcardAdminApi.updateFlashcard(id, data),
    onSuccess: () => {
      toast.success("Flashcard updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "flashcards", "list"],
      });
      setIsDialogOpen(false);
      setEditingFlashcard(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update flashcard",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => flashcardAdminApi.deleteFlashcard(id),
    onSuccess: () => {
      toast.success("Flashcard deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "flashcards", "list"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete flashcard",
      );
    },
  });

  const generateMutation = useMutation({
    mutationFn: (vocabularyId: string) =>
      flashcardAdminApi.generateFromVocabulary(vocabularyId),
    onSuccess: () => {
      toast.success("Flashcard generated successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "flashcards", "list"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to generate flashcard",
      );
    },
  });

  const resetForm = () => {
    setForm({
      vocabularyId: "",
      frontContent: "",
      backContent: "",
      hint: "",
    });
  };

  const openEdit = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setForm({
      vocabularyId: flashcard.vocabularyId,
      frontContent: flashcard.frontContent,
      backContent: flashcard.backContent,
      hint: flashcard.hint || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingFlashcard) {
      updateMutation.mutate({ id: editingFlashcard.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Flashcard Management
          </h1>
          <p className="text-muted-foreground">
            Manage flashcards for the spaced repetition system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Flashcard
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingFlashcard ? "Edit Flashcard" : "Create New Flashcard"}
              </DialogTitle>
              <DialogDescription>
                {editingFlashcard
                  ? "Update the flashcard content"
                  : "Create a new flashcard for vocabulary learning"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="vocabulary">Vocabulary</Label>
                <Select
                  value={form.vocabularyId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, vocabularyId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vocabulary word" />
                  </SelectTrigger>
                  <SelectContent>
                    {vocabularies?.data?.map((vocab) => (
                      <SelectItem key={vocab.id} value={vocab.id}>
                        {vocab.word} - {vocab.meaning.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="front">Front Content</Label>
                <Textarea
                  id="front"
                  value={form.frontContent}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      frontContent: e.target.value,
                    }))
                  }
                  placeholder="Question or prompt shown to the user"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="back">Back Content</Label>
                <Textarea
                  id="back"
                  value={form.backContent}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      backContent: e.target.value,
                    }))
                  }
                  placeholder="Answer or explanation"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hint">Hint (optional)</Label>
                <Input
                  id="hint"
                  value={form.hint}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hint: e.target.value }))
                  }
                  placeholder="Optional hint for the user"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingFlashcard(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingFlashcard ? "Update" : "Create"}
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
                placeholder="Search flashcards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics?.data?.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Flashcards Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Flashcards ({flashcards?.meta?.total || 0})
          </CardTitle>
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
                      <th className="text-left py-3 px-4 font-medium">Front</th>
                      <th className="text-left py-3 px-4 font-medium">Back</th>
                      <th className="text-left py-3 px-4 font-medium">Word</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Reviews
                      </th>
                      <th className="text-right py-3 px-4 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {flashcards?.data?.map((card) => (
                      <tr key={card.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <p className="text-sm max-w-xs truncate">
                            {card.frontContent}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm max-w-xs truncate">
                            {card.backContent}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">
                            {card.vocabulary?.word || "N/A"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">
                            {card._count?.reviews || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(card)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this flashcard?",
                                  )
                                ) {
                                  deleteMutation.mutate(card.id);
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
                  Showing {(flashcards?.meta?.page ?? 1) * (flashcards?.meta?.limit ?? 20) - (flashcards?.meta?.limit ?? 20) + 1} - {Math.min((flashcards?.meta?.page ?? 1) * (flashcards?.meta?.limit ?? 20), flashcards?.meta?.total ?? 0)} of {flashcards?.meta?.total ?? 0} flashcards (Page {page} of {flashcards?.meta?.totalPages || 1})
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
                      page >= (flashcards?.meta?.totalPages || 1)
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {(!flashcards?.data ||
                flashcards.data.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No flashcards found
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
