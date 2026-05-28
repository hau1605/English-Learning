"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flashcardAdminApi,
  Flashcard,
  CreateFlashcardDto,
  UpdateFlashcardDto,
} from "@/features/admin/api/flashcard-admin.api";
import { vocabularyApi } from "@/features/admin/api/vocabulary.api";
import { Plus, Search } from "lucide-react";
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
import { AdminDataTable } from "@/components/admin/admin-data-table";

const flashcardCode = (item: Flashcard, index: number) =>
  `FC-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

export default function AdminFlashcardsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [vocabularySearch, setVocabularySearch] = useState("");
  const [form, setForm] = useState<CreateFlashcardDto>({
    vocabularyId: "",
    frontContent: "",
    backContent: "",
    audioUrl: "",
    imageUrl: "",
    hint: "",
  });

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ["admin", "flashcards", "list", { page, limit, search, topicId }],
    queryFn: () =>
      flashcardAdminApi.getFlashcards({
        page,
        limit,
        search: search || undefined,
        topicId: topicId === "all" ? undefined : topicId || undefined,
      }),
  });

  const { data: topics } = useQuery({
    queryKey: ["admin", "vocabulary", "topics"],
    queryFn: vocabularyApi.getTopicsAdmin,
  });

  const { data: vocabularies, isFetching: isLoadingVocabularies } = useQuery({
    queryKey: ["admin", "vocabulary", "list", { search: vocabularySearch }],
    queryFn: () => vocabularyApi.getVocabulariesAdmin({ limit: 50, search: vocabularySearch || undefined }),
    enabled: isDialogOpen,
  });

  const selectedVocabulary = useMemo(
    () => vocabularies?.data?.find((vocab) => vocab.id === form.vocabularyId),
    [form.vocabularyId, vocabularies?.data]
  );
  const displayedVocabulary =
    selectedVocabulary ?? (editingFlashcard?.vocabularyId === form.vocabularyId ? editingFlashcard.vocabulary : undefined);
  const displayedVocabularyLabel = displayedVocabulary
    ? `${displayedVocabulary.word} - ${displayedVocabulary.meaning.substring(0, 30)}`
    : "";

  const createMutation = useMutation({
    mutationFn: (data: CreateFlashcardDto) => flashcardAdminApi.createFlashcard(data),
    onSuccess: () => {
      toast.success("Flashcard created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "flashcards", "list"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create flashcard");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlashcardDto }) =>
      flashcardAdminApi.updateFlashcard(id, data),
    onSuccess: () => {
      toast.success("Flashcard updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "flashcards", "list"] });
      setIsDialogOpen(false);
      setEditingFlashcard(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update flashcard");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => flashcardAdminApi.deleteFlashcard(id),
    onSuccess: () => {
      toast.success("Flashcard deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "flashcards", "list"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete flashcard");
    },
  });

  const resetForm = () => {
    setForm({
      vocabularyId: "",
      frontContent: "",
      backContent: "",
      audioUrl: "",
      imageUrl: "",
      hint: "",
    });
    setVocabularySearch("");
  };

  const openEdit = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setForm({
      vocabularyId: flashcard.vocabularyId,
      frontContent: flashcard.frontContent,
      backContent: flashcard.backContent,
      audioUrl: flashcard.audioUrl || "",
      imageUrl: flashcard.imageUrl || "",
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

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingFlashcard(null);
      resetForm();
    }
  };

  return (
    <>
      <AdminDataTable
        title="Quan ly flashcards"
        data={flashcards?.data || []}
        isLoading={isLoading}
        total={flashcards?.meta?.total || 0}
        page={page}
        pageSize={limit}
        totalPages={flashcards?.meta?.totalPages || 1}
        onPageChange={setPage}
        onPageSizeChange={(nextLimit) => {
          setPage(1);
          setLimit(nextLimit);
        }}
        getCode={flashcardCode}
        getTitle={(item) => item.frontContent}
        minWidth={1180}
        columns={[
          {
            key: "vocabularyId",
            header: "Vocabulary",
            render: (item) => item.vocabulary?.word || item.vocabularyId,
            className: "max-w-[180px] truncate",
          },
          {
            key: "frontContent",
            header: "Front content",
            render: (item) => <span className="line-clamp-1">{item.frontContent}</span>,
            className: "min-w-[220px]",
          },
          {
            key: "backContent",
            header: "Back content",
            render: (item) => <span className="line-clamp-1">{item.backContent}</span>,
            className: "min-w-[220px]",
          },
          {
            key: "audioUrl",
            header: "Audio URL",
            render: (item) => item.audioUrl || "---",
            className: "max-w-[180px] truncate",
          },
          {
            key: "imageUrl",
            header: "Image URL",
            render: (item) => item.imageUrl || "---",
            className: "max-w-[180px] truncate",
          },
          {
            key: "hint",
            header: "Hint",
            render: (item) => item.hint || "---",
            className: "max-w-[180px] truncate",
          },
          {
            key: "createdAt",
            header: "Created at",
            render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN"),
          },
          {
            key: "updatedAt",
            header: "Updated at",
            render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN"),
          },
        ]}
        detailFields={[
          { label: "ID", render: (item) => item.id },
          { label: "Vocabulary", render: (item) => item.vocabulary?.word || item.vocabularyId },
          { label: "Front content", render: (item) => item.frontContent },
          { label: "Back content", render: (item) => item.backContent },
          { label: "Audio URL", render: (item) => item.audioUrl },
          { label: "Image URL", render: (item) => item.imageUrl },
          { label: "Hint", render: (item) => item.hint },
          { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
          { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
        ]}
        toolbar={
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchableSelect
              value={topicId}
              onValueChange={(value) => { setPage(1); setTopicId(value); }}
              placeholder="Tat ca topics"
              className="h-9 w-full rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background lg:w-[190px]"
              options={[
                { value: "all", label: "Tat ca topics" },
                ...(topics?.data?.map((topic) => ({ value: topic.id, label: topic.name })) || []),
              ]}
            />
            <div className="relative">
              <Input
                value={search}
                onChange={(event) => { setPage(1); setSearch(event.target.value); }}
                className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background lg:w-[260px]"
                placeholder="Tim theo tu khoa..."
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800">
                  <Plus className="h-4 w-4" />
                  Them moi
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingFlashcard ? "Edit Flashcard" : "Create Flashcard"}</DialogTitle>
                  <DialogDescription>Cap nhat du lieu dung cac cot trong bang flashcards.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Vocabulary</Label>
                    <SearchableSelect
                      value={form.vocabularyId}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, vocabularyId: value }))}
                      onSearchChange={setVocabularySearch}
                      selectedLabel={displayedVocabularyLabel}
                      shouldFilter={false}
                      loading={isLoadingVocabularies}
                      emptyText="No vocabulary found."
                      placeholder="Select a vocabulary word"
                      options={(vocabularies?.data || []).map((vocab) => ({
                        value: vocab.id,
                        label: `${vocab.word} - ${vocab.meaning.substring(0, 60)}`,
                        searchText: `${vocab.word} ${vocab.meaning}`,
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Front content</Label>
                    <Textarea value={form.frontContent} onChange={(event) => setForm((prev) => ({ ...prev, frontContent: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Back content</Label>
                    <Textarea value={form.backContent} onChange={(event) => setForm((prev) => ({ ...prev, backContent: event.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Audio URL</Label>
                      <Input value={form.audioUrl || ""} onChange={(event) => setForm((prev) => ({ ...prev, audioUrl: event.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Image URL</Label>
                      <Input value={form.imageUrl || ""} onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Hint</Label>
                    <Input value={form.hint || ""} onChange={(event) => setForm((prev) => ({ ...prev, hint: event.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingFlashcard(null); resetForm(); }}>Huy</Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingFlashcard ? "Cap nhat" : "Tao moi"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
        onEdit={openEdit}
        onDelete={(item) => {
          if (confirm("Xoa flashcard nay?")) deleteMutation.mutate(item.id);
        }}
      />
    </>
  );
}
