"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import {
  vocabularyApi,
  Topic,
  Vocabulary,
  CreateTopicDto,
  CreateVocabularyDto,
  UpdateVocabularyDto,
  ExportFormat,
  ImportVocabularyDto,
} from "@/features/admin/api/vocabulary.api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils";

export default function AdminVocabularyPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isVocabDialogOpen, setIsVocabDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);

  // Import/Export state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importTopicId, setImportTopicId] = useState<string>("");
  const [importDefaultDifficulty, setImportDefaultDifficulty] = useState<number | undefined>(undefined);
  const [importCreateTopic, setImportCreateTopic] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportTopicId, setExportTopicId] = useState<string>("all");
  const [exportDifficulty, setExportDifficulty] = useState<string>("all");

  // Topic form state
  const [topicForm, setTopicForm] = useState<CreateTopicDto>({
    name: "",
    slug: "",
    description: "",
    icon: "",
  });

  // Vocabulary form state
  const [vocabForm, setVocabForm] = useState<CreateVocabularyDto>({
    topicId: "",
    word: "",
    pronunciation: "",
    meaning: "",
    example: "",
    exampleTranslation: "",
    difficulty: 1,
    partOfSpeech: "",
  });

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedDifficulty, setDebouncedDifficulty] = useState(difficulty);

  // Debounce search/difficulty changes (500ms delay)
  const debouncedSearchChange = useDebouncedCallback(
    (value: string) => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on filter change
    },
    500
  );

  const debouncedDifficultyChange = useDebouncedCallback(
    (value: string) => {
      setDebouncedDifficulty(value);
      setPage(1);
    },
    500
  );

  // Sync local state with debounced state (for controlled input display)
  useEffect(() => {
    setDebouncedSearch(search);
  }, [search]);

  useEffect(() => {
    setDebouncedDifficulty(difficulty);
  }, [difficulty]);

  // Queries
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["admin", "vocabulary", "topics"],
    queryFn: vocabularyApi.getTopicsAdmin,
  });

  // keepPreviousData ensures smooth pagination - keeps old data visible while fetching new page
  const { data: vocabData, isLoading: vocabLoading } = useQuery({
    queryKey: ["admin", "vocabulary", "list", { page, debouncedSearch, debouncedDifficulty }],
    queryFn: () =>
      vocabularyApi.getVocabulariesAdmin({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        difficulty: debouncedDifficulty ? parseInt(debouncedDifficulty) : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Mutations
  const createTopic = useMutation({
    mutationFn: (data: CreateTopicDto) => vocabularyApi.createTopic(data),
    onSuccess: () => {
      toast.success("Topic created successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "topics"],
      });
      setIsTopicDialogOpen(false);
      resetTopicForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create topic");
    },
  });

  const updateTopic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTopicDto }) =>
      vocabularyApi.updateTopic(id, data),
    onSuccess: () => {
      toast.success("Topic updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "topics"],
      });
      setIsTopicDialogOpen(false);
      setEditingTopic(null);
      resetTopicForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update topic");
    },
  });

  const deleteTopic = useMutation({
    mutationFn: (id: string) => vocabularyApi.deleteTopic(id),
    onSuccess: () => {
      toast.success("Topic deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "topics"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete topic");
    },
  });

  const createVocab = useMutation({
    mutationFn: (data: CreateVocabularyDto) =>
      vocabularyApi.createVocabulary(data),
    onSuccess: () => {
      toast.success("Vocabulary created successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "list"],
      });
      setIsVocabDialogOpen(false);
      resetVocabForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create vocabulary",
      );
    },
  });

  const updateVocab = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVocabularyDto }) =>
      vocabularyApi.updateVocabulary(id, data),
    onSuccess: () => {
      toast.success("Vocabulary updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "list"],
      });
      setIsVocabDialogOpen(false);
      setEditingVocab(null);
      resetVocabForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update vocabulary",
      );
    },
  });

  const deleteVocab = useMutation({
    mutationFn: (id: string) => vocabularyApi.deleteVocabulary(id),
    onSuccess: () => {
      toast.success("Vocabulary deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "list"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete vocabulary",
      );
    },
  });

  // Import mutation
  const importVocabulary = useMutation({
    mutationFn: async ({ file, params }: { file: File; params: ImportVocabularyDto }) => {
      return vocabularyApi.importVocabulary(file, params);
    },
    onSuccess: (result) => {
      const data = result.data?.data;
      if (data) {
        toast.success(
          `Import completed: ${data.success} succeeded, ${data.failed} failed`,
        );
        if (data.errors && data.errors.length > 0) {
          const errorSummary = data.errors.slice(0, 3).map(
            (e: { row: number; error: string }) => `Row ${e.row}: ${e.error}`,
          ).join("\n");
          toast.error(`Errors:\n${errorSummary}${data.errors.length > 3 ? "\n..." : ""}`);
        }
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "vocabulary", "topics"],
      });
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      setImportTopicId("");
      setImportDefaultDifficulty(undefined);
      setImportCreateTopic("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to import vocabulary");
    },
  });

  // Export handler
  const handleExport = async () => {
    try {
      const params: any = { format: exportFormat };
      if (exportTopicId && exportTopicId !== "all") params.topicId = exportTopicId;
      if (exportDifficulty && exportDifficulty !== "all") params.difficulty = parseInt(exportDifficulty);

      const blob = await vocabularyApi.exportVocabulary(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vocabulary-export-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export completed successfully");
      setIsExportDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to export vocabulary");
    }
  };

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
      difficulty: 1,
      partOfSpeech: "",
    });
  };

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
      difficulty: vocab.difficulty,
      partOfSpeech: vocab.partOfSpeech || "",
    });
    setIsVocabDialogOpen(true);
  };

  const handleTopicSubmit = () => {
    if (editingTopic) {
      updateTopic.mutate({ id: editingTopic.id, data: topicForm });
    } else {
      createTopic.mutate(topicForm);
    }
  };

  const handleVocabSubmit = () => {
    if (editingVocab) {
      updateVocab.mutate({ id: editingVocab.id, data: vocabForm });
    } else {
      createVocab.mutate(vocabForm);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setTopicForm((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleImportSubmit = () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }
    if (!importTopicId && !importCreateTopic) {
      toast.error("Please select a topic or enter a new topic name");
      return;
    }

    const params: ImportVocabularyDto = {
      topicId: importTopicId || "temp",
      createTopicIfNotExists: importCreateTopic || undefined,
    };
    if (importDefaultDifficulty) {
      params.defaultDifficulty = importDefaultDifficulty;
    }

    importVocabulary.mutate({ file: selectedFile, params });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vocabulary Management
          </h1>
          <p className="text-muted-foreground">
            Manage topics and vocabularies for the learning platform
          </p>
        </div>
        <div className="flex gap-2">
          {/* Import Button */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Import Vocabulary</DialogTitle>
                <DialogDescription>
                  Upload a CSV, XLSX, or JSON file to import vocabulary. The file should have columns: word, meaning, pronunciation, example, partOfSpeech, difficulty.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="importFile">File</Label>
                  <Input
                    id="importFile"
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xlsx,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: CSV, XLSX, JSON (max 10MB)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="importTopic">Topic</Label>
                  <Select value={importTopicId} onValueChange={setImportTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics?.data?.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="importNewTopic">Or Create New Topic</Label>
                  <Input
                    id="importNewTopic"
                    value={importCreateTopic}
                    onChange={(e) => {
                      setImportCreateTopic(e.target.value);
                      if (e.target.value) setImportTopicId("");
                    }}
                    placeholder="Enter new topic name"
                  />
                  <p className="text-xs text-muted-foreground">
                    If both topic and new topic name are provided, topic will be used
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="importDifficulty">Default Difficulty</Label>
                  <Select
                    value={importDefaultDifficulty?.toString() || "none"}
                    onValueChange={(value) =>
                      setImportDefaultDifficulty(value === "none" ? undefined : parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use file values" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Use file values</SelectItem>
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                      <SelectItem value="4">Very Hard</SelectItem>
                      <SelectItem value="5">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImportSubmit} disabled={importVocabulary.isPending}>
                  {importVocabulary.isPending ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Export Button */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Export Vocabulary</DialogTitle>
                <DialogDescription>
                  Export vocabularies to CSV, XLSX, or JSON format for backup or sharing.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Format</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={exportFormat === "csv" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportFormat("csv")}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      variant={exportFormat === "xlsx" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportFormat("xlsx")}
                      className="flex-1"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      variant={exportFormat === "json" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportFormat("json")}
                      className="flex-1"
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      JSON
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exportTopic">Topic (Optional)</Label>
                  <Select value={exportTopicId} onValueChange={setExportTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All topics</SelectItem>
                      {topics?.data?.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="exportDifficulty">Difficulty (Optional)</Label>
                  <Select value={exportDifficulty} onValueChange={setExportDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="1">Easy</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">Hard</SelectItem>
                      <SelectItem value="4">Very Hard</SelectItem>
                      <SelectItem value="5">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTopic ? "Edit Topic" : "Create New Topic"}
                </DialogTitle>
                <DialogDescription>
                  {editingTopic
                    ? "Update the topic details"
                    : "Add a new topic for vocabulary organization"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={topicForm.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Business English"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={topicForm.slug}
                    onChange={(e) =>
                      setTopicForm((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    placeholder="e.g., business-english"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={topicForm.description}
                    onChange={(e) =>
                      setTopicForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of this topic..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon (optional)</Label>
                  <Input
                    id="icon"
                    value={topicForm.icon}
                    onChange={(e) =>
                      setTopicForm((prev) => ({
                        ...prev,
                        icon: e.target.value,
                      }))
                    }
                    placeholder="Icon identifier"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTopicDialogOpen(false);
                    setEditingTopic(null);
                    resetTopicForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTopicSubmit}
                  disabled={createTopic.isPending || updateTopic.isPending}
                >
                  {editingTopic ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isVocabDialogOpen} onOpenChange={setIsVocabDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vocabulary
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingVocab ? "Edit Vocabulary" : "Create New Vocabulary"}
                </DialogTitle>
                <DialogDescription>
                  {editingVocab
                    ? "Update the vocabulary entry"
                    : "Add a new vocabulary word"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Select
                    value={vocabForm.topicId}
                    onValueChange={(value) =>
                      setVocabForm((prev) => ({ ...prev, topicId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics?.data?.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="word">Word</Label>
                    <Input
                      id="word"
                      value={vocabForm.word}
                      onChange={(e) =>
                        setVocabForm((prev) => ({
                          ...prev,
                          word: e.target.value,
                        }))
                      }
                      placeholder="e.g., accomplish"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pronunciation">Pronunciation</Label>
                    <Input
                      id="pronunciation"
                      value={vocabForm.pronunciation}
                      onChange={(e) =>
                        setVocabForm((prev) => ({
                          ...prev,
                          pronunciation: e.target.value,
                        }))
                      }
                      placeholder="e.g., /əˈkʌmplɪʃ/"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meaning">Meaning</Label>
                  <Input
                    id="meaning"
                    value={vocabForm.meaning}
                    onChange={(e) =>
                      setVocabForm((prev) => ({
                        ...prev,
                        meaning: e.target.value,
                      }))
                    }
                    placeholder="e.g., to succeed in doing something"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="example">Example</Label>
                  <Textarea
                    id="example"
                    value={vocabForm.example}
                    onChange={(e) =>
                      setVocabForm((prev) => ({
                        ...prev,
                        example: e.target.value,
                      }))
                    }
                    placeholder="Example sentence..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={vocabForm.difficulty?.toString()}
                      onValueChange={(value) =>
                        setVocabForm((prev) => ({
                          ...prev,
                          difficulty: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Easy</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Hard</SelectItem>
                        <SelectItem value="4">Very Hard</SelectItem>
                        <SelectItem value="5">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="partOfSpeech">Part of Speech</Label>
                    <Input
                      id="partOfSpeech"
                      value={vocabForm.partOfSpeech}
                      onChange={(e) =>
                        setVocabForm((prev) => ({
                          ...prev,
                          partOfSpeech: e.target.value,
                        }))
                      }
                      placeholder="e.g., verb"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVocabDialogOpen(false);
                    setEditingVocab(null);
                    resetVocabForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVocabSubmit}
                  disabled={createVocab.isPending || updateVocab.isPending}
                >
                  {editingVocab ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="vocabularies">
        <TabsList>
          <TabsTrigger value="vocabularies">Vocabularies</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="vocabularies" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by word or meaning..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      debouncedSearchChange(e.target.value);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select 
                  value={difficulty || "all"} 
                  onValueChange={(value) => {
                    const newDifficulty = value === "all" ? "" : value;
                    setDifficulty(newDifficulty);
                    debouncedDifficultyChange(newDifficulty);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                    <SelectItem value="4">Very Hard</SelectItem>
                    <SelectItem value="5">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Vocabulary Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Vocabularies ({vocabData?.meta?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vocabLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">
                            Word
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            Topic
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            Meaning
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            Difficulty
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {vocabData?.data?.map((vocab) => (
                          <tr
                            key={vocab.id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{vocab.word}</p>
                                {vocab.pronunciation && (
                                  <p className="text-sm text-muted-foreground">
                                    {vocab.pronunciation}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary">
                                {vocab.topic?.name || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm max-w-xs truncate">
                                {vocab.meaning}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  vocab.difficulty <= 2
                                    ? "default"
                                    : vocab.difficulty <= 3
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {
                                  [
                                    "Easy",
                                    "Medium",
                                    "Hard",
                                    "Very Hard",
                                    "Expert",
                                  ][vocab.difficulty - 1]
                                }
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditVocab(vocab)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this vocabulary?",
                                      )
                                    ) {
                                      deleteVocab.mutate(vocab.id);
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
                      Showing {(vocabData?.meta?.page ?? 1) * (vocabData?.meta?.limit ?? 20) - (vocabData?.meta?.limit ?? 20) + 1} - {Math.min((vocabData?.meta?.page ?? 1) * (vocabData?.meta?.limit ?? 20), vocabData?.meta?.total ?? 0)} of {vocabData?.meta?.total ?? 0} vocabularies (Page {page} of {vocabData?.meta?.totalPages || 1})
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
                          page >= (vocabData?.meta?.totalPages || 1)
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {(!vocabData?.data || vocabData.data.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No vocabularies found
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          {topicsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topics?.data?.map((topic) => (
                <Card
                  key={topic.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {topic.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTopic(topic)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this topic? All vocabularies in this topic will also be deleted.",
                            )
                          ) {
                            deleteTopic.mutate(topic.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {topic.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {topic.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {topic._count?.vocabularies || 0} vocabularies
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        /{topic.slug}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!topics?.data || topics.data.length === 0) && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No topics found. Create your first topic to get started.
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
