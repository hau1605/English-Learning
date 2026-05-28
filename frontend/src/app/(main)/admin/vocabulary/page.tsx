"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  vocabularyApi,
  Topic,
  Vocabulary,
  CreateTopicDto,
  CreateVocabularyDto,
  UpdateVocabularyDto,
} from "@/features/admin/api/vocabulary.api";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/admin-data-table";

const difficultyOptions = [
  { value: "all", label: "Tat ca level" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
];
import { cn } from "@/utils";

const vocabCode = (item: Vocabulary, index: number) =>
  `VOC-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

const topicCode = (item: Topic, index: number) =>
  `TOP-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

export default function AdminVocabularyPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"vocabularies" | "topics">("vocabularies");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isVocabDialogOpen, setIsVocabDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);

  const [topicForm, setTopicForm] = useState<CreateTopicDto>({
    name: "",
    slug: "",
    description: "",
    icon: "",
  });
  const [vocabForm, setVocabForm] = useState<CreateVocabularyDto>({
    topicId: "",
    word: "",
    pronunciation: "",
    meaning: "",
    example: "",
    exampleTranslation: "",
    audioUrl: "",
    imageUrl: "",
    difficulty: 1,
    partOfSpeech: "",
  });

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["admin", "vocabulary", "topics"],
    queryFn: vocabularyApi.getTopicsAdmin,
  });

  const { data: vocabData, isLoading: vocabLoading } = useQuery({
    queryKey: ["admin", "vocabulary", "list", { page, limit, search, difficulty }],
    queryFn: () =>
      vocabularyApi.getVocabulariesAdmin({
        page,
        limit,
        search: search || undefined,
        difficulty: difficulty ? parseInt(difficulty) : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const createTopic = useMutation({
    mutationFn: (data: CreateTopicDto) => vocabularyApi.createTopic(data),
    onSuccess: () => {
      toast.success("Topic created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary", "topics"] });
      setIsTopicDialogOpen(false);
      resetTopicForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create topic"),
  });

  const updateTopic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTopicDto }) =>
      vocabularyApi.updateTopic(id, data),
    onSuccess: () => {
      toast.success("Topic updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary", "topics"] });
      setIsTopicDialogOpen(false);
      setEditingTopic(null);
      resetTopicForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to update topic"),
  });

  const deleteTopic = useMutation({
    mutationFn: (id: string) => vocabularyApi.deleteTopic(id),
    onSuccess: () => {
      toast.success("Topic deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary", "topics"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to delete topic"),
  });

  const createVocab = useMutation({
    mutationFn: (data: CreateVocabularyDto) => vocabularyApi.createVocabulary(data),
    onSuccess: () => {
      toast.success("Vocabulary created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary", "list"] });
      setIsVocabDialogOpen(false);
      resetVocabForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create vocabulary"),
  });

  const updateVocab = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVocabularyDto }) =>
      vocabularyApi.updateVocabulary(id, data),
    onSuccess: () => {
      toast.success("Vocabulary updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary", "list"] });
      setIsVocabDialogOpen(false);
      setEditingVocab(null);
      resetVocabForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to update vocabulary"),
  });

  const deleteVocab = useMutation({
    mutationFn: (id: string) => vocabularyApi.deleteVocabulary(id),
    onSuccess: () => {
      toast.success("Vocabulary deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "vocabulary", "list"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to delete vocabulary"),
  });

  const resetTopicForm = () => {
    setTopicForm({ name: "", slug: "", description: "", icon: "" });
  };

  const resetVocabForm = () => {
    setVocabForm({
      topicId: "",
      word: "",
      pronunciation: "",
      meaning: "",
      example: "",
      exampleTranslation: "",
      audioUrl: "",
      imageUrl: "",
      difficulty: 1,
      partOfSpeech: "",
    });
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicForm({
      name: topic.name,
      slug: topic.slug,
      description: topic.description || "",
      icon: topic.icon || "",
    });
    setIsTopicDialogOpen(true);
  };

  const openEditVocab = (vocab: Vocabulary) => {
    setEditingVocab(vocab);
    setVocabForm({
      topicId: vocab.topicId,
      word: vocab.word,
      pronunciation: vocab.pronunciation || "",
      meaning: vocab.meaning,
      example: vocab.example || "",
      exampleTranslation: vocab.exampleTranslation || "",
      audioUrl: vocab.audioUrl || "",
      imageUrl: vocab.imageUrl || "",
      difficulty: vocab.difficulty,
      partOfSpeech: vocab.partOfSpeech || "",
    });
    setIsVocabDialogOpen(true);
  };

  const handleTopicSubmit = () => {
    if (editingTopic) updateTopic.mutate({ id: editingTopic.id, data: topicForm });
    else createTopic.mutate(topicForm);
  };

  const handleVocabSubmit = () => {
    if (editingVocab) updateVocab.mutate({ id: editingVocab.id, data: vocabForm });
    else createVocab.mutate(vocabForm);
  };

  const tabs = (
    <div className="flex items-end">
      <button
        type="button"
        onClick={() => setActiveTab("vocabularies")}
        className={cn(
          "h-9 border border-b-0 px-4 text-xs font-medium",
          activeTab === "vocabularies"
            ? "border-slate-200 bg-white text-blue-700 dark:border-border dark:bg-background"
            : "border-transparent bg-slate-100 text-slate-600 dark:bg-muted",
        )}
      >
        Vocabularies
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("topics")}
        className={cn(
          "h-9 border border-b-0 px-4 text-xs font-medium",
          activeTab === "topics"
            ? "border-slate-200 bg-white text-blue-700 dark:border-border dark:bg-background"
            : "border-transparent bg-slate-100 text-slate-600 dark:bg-muted",
        )}
      >
        Topics
      </button>
    </div>
  );

  if (activeTab === "topics") {
    return (
      <AdminDataTable
        title="Quan ly topics"
        data={topics?.data || []}
        isLoading={topicsLoading}
        total={topics?.data?.length || 0}
        page={1}
        totalPages={1}
        getCode={topicCode}
        getTitle={(item) => item.name}
        minWidth={980}
        columns={[
          { key: "name", header: "Name", render: (item) => item.name, className: "min-w-[180px]" },
          { key: "slug", header: "Slug", render: (item) => item.slug, className: "min-w-[180px]" },
          { key: "description", header: "Description", render: (item) => item.description || "---", className: "max-w-[280px] truncate" },
          { key: "icon", header: "Icon", render: (item) => item.icon || "---" },
          { key: "createdAt", header: "Created at", render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN") },
          { key: "updatedAt", header: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN") },
        ]}
        detailFields={[
          { label: "ID", render: (item) => item.id },
          { label: "Name", render: (item) => item.name },
          { label: "Slug", render: (item) => item.slug },
          { label: "Description", render: (item) => item.description },
          { label: "Icon", render: (item) => item.icon },
          { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
          { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
        ]}
        toolbar={
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            {tabs}
            <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800">
                  <Plus className="h-4 w-4" />
                  Them moi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTopic ? "Edit Topic" : "Create Topic"}</DialogTitle>
                  <DialogDescription>Cap nhat du lieu dung cac cot trong bang topics.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input value={topicForm.name} onChange={(event) => setTopicForm((prev) => ({ ...prev, name: event.target.value, slug: generateSlug(event.target.value) }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Slug</Label>
                    <Input value={topicForm.slug} onChange={(event) => setTopicForm((prev) => ({ ...prev, slug: event.target.value }))} disabled={!!editingTopic} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea value={topicForm.description || ""} onChange={(event) => setTopicForm((prev) => ({ ...prev, description: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Icon</Label>
                    <Input value={topicForm.icon || ""} onChange={(event) => setTopicForm((prev) => ({ ...prev, icon: event.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsTopicDialogOpen(false); setEditingTopic(null); resetTopicForm(); }}>Huy</Button>
                  <Button onClick={handleTopicSubmit} disabled={createTopic.isPending || updateTopic.isPending}>
                    {editingTopic ? "Cap nhat" : "Tao moi"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
        onEdit={openEditTopic}
        onDelete={(item) => {
          if (confirm("Xoa topic nay?")) deleteTopic.mutate(item.id);
        }}
      />
    );
  }

  return (
    <AdminDataTable
      title="Quan ly vocabulary"
      data={vocabData?.data || []}
      isLoading={vocabLoading}
      total={vocabData?.meta?.total || 0}
      page={page}
      pageSize={limit}
      totalPages={vocabData?.meta?.totalPages || 1}
      onPageChange={setPage}
      onPageSizeChange={(nextLimit) => {
        setPage(1);
        setLimit(nextLimit);
      }}
      getCode={vocabCode}
      getTitle={(item) => item.word}
      minWidth={1480}
      columns={[
        { key: "topic", header: "Topic", render: (item) => item.topic?.name || item.topicId, className: "max-w-[170px] truncate" },
        { key: "word", header: "Word", render: (item) => item.word, className: "min-w-[150px]" },
        { key: "pronunciation", header: "Pronunciation", render: (item) => item.pronunciation || "---" },
        { key: "meaning", header: "Meaning", render: (item) => item.meaning, className: "max-w-[240px] truncate" },
        { key: "example", header: "Example", render: (item) => item.example || "---", className: "max-w-[240px] truncate" },
        { key: "exampleTranslation", header: "Example translation", render: (item) => item.exampleTranslation || "---", className: "max-w-[240px] truncate" },
        { key: "audioUrl", header: "Audio URL", render: (item) => item.audioUrl || "---", className: "max-w-[180px] truncate" },
        { key: "imageUrl", header: "Image URL", render: (item) => item.imageUrl || "---", className: "max-w-[180px] truncate" },
        { key: "difficulty", header: "Difficulty", render: (item) => item.difficulty },
        { key: "partOfSpeech", header: "Part of speech", render: (item) => item.partOfSpeech || "---" },
        { key: "createdAt", header: "Created at", render: (item) => new Date(item.createdAt).toLocaleDateString("vi-VN") },
        { key: "updatedAt", header: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleDateString("vi-VN") },
      ]}
      detailFields={[
        { label: "ID", render: (item) => item.id },
        { label: "Topic", render: (item) => item.topic?.name || item.topicId },
        { label: "Word", render: (item) => item.word },
        { label: "Pronunciation", render: (item) => item.pronunciation },
        { label: "Meaning", render: (item) => item.meaning },
        { label: "Example", render: (item) => item.example },
        { label: "Example translation", render: (item) => item.exampleTranslation },
        { label: "Audio URL", render: (item) => item.audioUrl },
        { label: "Image URL", render: (item) => item.imageUrl },
        { label: "Difficulty", render: (item) => item.difficulty },
        { label: "Part of speech", render: (item) => item.partOfSpeech },
        { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
        { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
      ]}
      toolbar={
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {tabs}
          <SearchableSelect
            value={difficulty || "all"}
            onValueChange={(value) => { setPage(1); setDifficulty(value === "all" ? "" : value); }}
            placeholder="Difficulty"
            className="h-9 w-full rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background lg:w-[150px]"
            options={difficultyOptions}
          />
          <div className="relative">
            <Input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background lg:w-[240px]" placeholder="Tim theo tu khoa..." />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <Dialog open={isVocabDialogOpen} onOpenChange={setIsVocabDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800">
                <Plus className="h-4 w-4" />
                Them moi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
              <DialogHeader>
                <DialogTitle>{editingVocab ? "Edit Vocabulary" : "Create Vocabulary"}</DialogTitle>
                <DialogDescription>Cap nhat du lieu dung cac cot trong bang vocabularies.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Topic</Label>
                  <SearchableSelect
                    value={vocabForm.topicId}
                    onValueChange={(value) => setVocabForm((prev) => ({ ...prev, topicId: value }))}
                    placeholder="Select topic"
                    options={(topics?.data || []).map((topic) => ({ value: topic.id, label: topic.name }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Word</Label>
                    <Input value={vocabForm.word} onChange={(event) => setVocabForm((prev) => ({ ...prev, word: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Pronunciation</Label>
                    <Input value={vocabForm.pronunciation || ""} onChange={(event) => setVocabForm((prev) => ({ ...prev, pronunciation: event.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Meaning</Label>
                  <Input value={vocabForm.meaning} onChange={(event) => setVocabForm((prev) => ({ ...prev, meaning: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Example</Label>
                  <Textarea value={vocabForm.example || ""} onChange={(event) => setVocabForm((prev) => ({ ...prev, example: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Example translation</Label>
                  <Textarea value={vocabForm.exampleTranslation || ""} onChange={(event) => setVocabForm((prev) => ({ ...prev, exampleTranslation: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Audio URL</Label>
                    <Input value={vocabForm.audioUrl || ""} onChange={(event) => setVocabForm((prev) => ({ ...prev, audioUrl: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Image URL</Label>
                    <Input value={vocabForm.imageUrl || ""} onChange={(event) => setVocabForm((prev) => ({ ...prev, imageUrl: event.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Difficulty</Label>
                    <Input type="number" min={1} max={5} value={vocabForm.difficulty || 1} onChange={(event) => setVocabForm((prev) => ({ ...prev, difficulty: parseInt(event.target.value) || 1 }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Part of speech</Label>
                    <Input value={vocabForm.partOfSpeech || ""} onChange={(event) => setVocabForm((prev) => ({ ...prev, partOfSpeech: event.target.value }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsVocabDialogOpen(false); setEditingVocab(null); resetVocabForm(); }}>Huy</Button>
                <Button onClick={handleVocabSubmit} disabled={createVocab.isPending || updateVocab.isPending}>
                  {editingVocab ? "Cap nhat" : "Tao moi"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
      onEdit={openEditVocab}
      onDelete={(item) => {
        if (confirm("Xoa vocabulary nay?")) deleteVocab.mutate(item.id);
      }}
    />
  );
}
