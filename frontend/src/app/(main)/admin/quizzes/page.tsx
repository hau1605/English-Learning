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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  quizAdminApi,
  Quiz,
  QuizQuestion,
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
} from "@/features/admin/api/quiz-admin.api";
import { Plus, Search, FileQuestion, Trash2, Edit, Check, X } from "lucide-react";
import { toast } from "sonner";
import { QUIZ_TYPE_LABELS } from "@/shared/types";
import { QuizType, QuestionType } from "@/shared/enums";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";

const quizCode = (item: Quiz, index: number) =>
  `QZ-${item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || String(index + 1).padStart(3, "0")}`;

const quizTypeOptions = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "FILL_BLANK", label: "Fill Blank" },
  { value: "MATCHING", label: "Matching" },
  { value: "SPEAKING", label: "Speaking" },
  { value: "MIXED", label: "Mixed" },
];

const questionTypeOptions = [
  { value: "SINGLE_CHOICE", label: "Single Choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "FILL_BLANK", label: "Fill in the Blank" },
];

export default function AdminQuizzesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [published, setPublished] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
  // Question management state
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<CreateQuestionDto>({
    type: "SINGLE_CHOICE" as QuestionType,
    question: "",
    explanation: "",
    points: 1,
    answers: [
      { answer: "", isCorrect: true, orderIndex: 0 },
      { answer: "", isCorrect: false, orderIndex: 1 },
      { answer: "", isCorrect: false, orderIndex: 2 },
      { answer: "", isCorrect: false, orderIndex: 3 },
    ],
  });
  
  const [form, setForm] = useState<CreateQuizDto>({
    lessonId: "",
    title: "",
    description: "",
    type: "MULTIPLE_CHOICE" as QuizType,
    durationSeconds: 600,
    passingScore: 70,
    maxAttempts: undefined,
    isGenerated: false,
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["admin", "quizzes", "list", { page, limit, search, type, published }],
    queryFn: () =>
      quizAdminApi.getQuizzes({
        page,
        limit,
        search: search || undefined,
        type: type ? (type as QuizType) : undefined,
        published: published === "true" ? true : published === "false" ? false : undefined,
      }),
  });

  // Questions query for selected quiz
  const { data: questionsData, refetch: refetchQuestions } = useQuery({
    queryKey: ["admin", "quizzes", "questions", selectedQuizId],
    queryFn: () => quizAdminApi.getQuestionsByQuiz(selectedQuizId!),
    enabled: !!selectedQuizId,
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

  // Question mutations
  const addQuestionMutation = useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: CreateQuestionDto }) =>
      quizAdminApi.addQuestion(quizId, data),
    onSuccess: () => {
      toast.success("Question added successfully");
      refetchQuestions();
      resetQuestionForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add question");
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ quizId, questionId, data }: { quizId: string; questionId: string; data: Partial<CreateQuestionDto> }) =>
      quizAdminApi.updateQuestion(quizId, questionId, data),
    onSuccess: () => {
      toast.success("Question updated successfully");
      refetchQuestions();
      resetQuestionForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update question");
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: ({ quizId, questionId }: { quizId: string; questionId: string }) =>
      quizAdminApi.deleteQuestion(quizId, questionId),
    onSuccess: () => {
      toast.success("Question deleted successfully");
      refetchQuestions();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete question");
    },
  });

  const resetForm = () => {
    setForm({
      lessonId: "",
      title: "",
      description: "",
      type: "MULTIPLE_CHOICE" as QuizType,
      durationSeconds: 600,
      passingScore: 70,
      maxAttempts: undefined,
      isGenerated: false,
    });
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      type: "SINGLE_CHOICE" as QuestionType,
      question: "",
      explanation: "",
      points: 1,
      answers: [
        { answer: "", isCorrect: true, orderIndex: 0 },
        { answer: "", isCorrect: false, orderIndex: 1 },
        { answer: "", isCorrect: false, orderIndex: 2 },
        { answer: "", isCorrect: false, orderIndex: 3 },
      ],
    });
  };

  const openEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setForm({
      lessonId: quiz.lessonId || "",
      title: quiz.title,
      description: quiz.description || "",
      type: quiz.type,
      durationSeconds: quiz.durationSeconds,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      isGenerated: quiz.isGenerated,
    });
    setIsDialogOpen(true);
  };

  const openQuestionManager = (quizId: string) => {
    setSelectedQuizId(quizId);
    setIsQuestionDialogOpen(true);
  };

  const openEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      type: question.type,
      question: question.question,
      explanation: question.explanation || "",
      points: question.points,
      answers: question.answers.map((a, i) => ({
        answer: a.answer,
        isCorrect: a.isCorrect,
        orderIndex: a.orderIndex ?? i,
      })),
    });
  };

  const handleQuestionSubmit = () => {
    if (!selectedQuizId) return;
    
    if (!questionForm.question.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (questionForm.answers.length < 2) {
      toast.error("At least 2 answers are required");
      return;
    }
    if (!questionForm.answers.some(a => a.isCorrect)) {
      toast.error("At least one correct answer is required");
      return;
    }

    if (editingQuestion) {
      updateQuestionMutation.mutate({
        quizId: selectedQuizId,
        questionId: editingQuestion.id,
        data: questionForm,
      });
    } else {
      addQuestionMutation.mutate({
        quizId: selectedQuizId,
        data: questionForm,
      });
    }
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      lessonId: form.lessonId || undefined,
      maxAttempts: form.maxAttempts || undefined,
    };
    if (editingQuiz) {
      updateMutation.mutate({ id: editingQuiz.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <AdminDataTable
        title="Manage Quizzes"
        data={quizzes?.data || []}
        isLoading={isLoading}
        total={quizzes?.meta?.total || 0}
        page={page}
        pageSize={limit}
        totalPages={quizzes?.meta?.totalPages || 1}
        onPageChange={setPage}
        onPageSizeChange={(nextLimit) => {
          setPage(1);
          setLimit(nextLimit);
        }}
        getCode={quizCode}
        getTitle={(item) => item.title}
        minWidth={1260}
        columns={[
          { key: "lesson", header: "Lesson", render: (item) => item.lesson?.title || item.lessonId || "---", className: "max-w-[160px] truncate" },
          { key: "title", header: "Title", render: (item) => <span className="line-clamp-1">{item.title}</span>, className: "min-w-[220px]" },
          { key: "description", header: "Description", render: (item) => item.description || "---", className: "max-w-[240px] truncate" },
          { key: "type", header: "Type", render: (item) => QUIZ_TYPE_LABELS[item.type] || item.type },
          { key: "questions", header: "Questions", render: (item) => item._count?.questions || 0 },
          { key: "durationSeconds", header: "Duration", render: (item) => item.durationSeconds ?? "---" },
          { key: "passingScore", header: "Passing score", render: (item) => item.passingScore },
          { key: "isGenerated", header: "Generated", render: (item) => (item.isGenerated ? "Yes" : "No") },
          { key: "publishedAt", header: "Published", render: (item) => item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("vi-VN") : "---" },
        ]}
        detailFields={[
          { label: "ID", render: (item) => item.id },
          { label: "Lesson", render: (item) => item.lesson?.title || item.lessonId },
          { label: "Title", render: (item) => item.title },
          { label: "Description", render: (item) => item.description },
          { label: "Type", render: (item) => item.type },
          { label: "Duration seconds", render: (item) => item.durationSeconds },
          { label: "Passing score", render: (item) => item.passingScore },
          { label: "Max attempts", render: (item) => item.maxAttempts },
          { label: "Questions count", render: (item) => item._count?.questions || 0 },
          { label: "Is generated", render: (item) => String(item.isGenerated) },
          { label: "Published at", render: (item) => item.publishedAt ? new Date(item.publishedAt).toLocaleString("vi-VN") : "---" },
          { label: "Created at", render: (item) => new Date(item.createdAt).toLocaleString("vi-VN") },
          { label: "Updated at", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
        ]}
        toolbar={
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchableSelect
              value={type || "all"}
              onValueChange={(value) => { setPage(1); setType(value === "all" ? "" : value); }}
              placeholder="All types"
              className="h-9 w-full rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background lg:w-[170px]"
              options={[{ value: "all", label: "All types" }, ...quizTypeOptions]}
            />
            <SearchableSelect
              value={published || "all"}
              onValueChange={(value) => { setPage(1); setPublished(value === "all" ? "" : value); }}
              placeholder="Status"
              className="h-9 w-full rounded border-slate-200 bg-white text-xs shadow-none dark:border-border dark:bg-background lg:w-[160px]"
              options={[
                { value: "all", label: "All" },
                { value: "true", label: "Published" },
                { value: "false", label: "Draft" },
              ]}
            />
            <div className="relative">
              <Input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} className="h-9 w-full rounded border-slate-200 bg-white pr-9 text-xs shadow-none dark:border-border dark:bg-background lg:w-[260px]" placeholder="Search..." />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 gap-2 rounded bg-blue-700 px-3 text-xs hover:bg-blue-800">
                  <Plus className="h-4 w-4" />
                  Create Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
                  <DialogDescription>Fill in the quiz details below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Lesson ID</Label>
                    <Input value={form.lessonId || ""} onChange={(event) => setForm((prev) => ({ ...prev, lessonId: event.target.value }))} placeholder="Optional lesson ID" />
                  </div>
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
                        onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as QuizType }))}
                        options={quizTypeOptions}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Duration (seconds)</Label>
                      <Input type="number" value={form.durationSeconds || ""} onChange={(event) => setForm((prev) => ({ ...prev, durationSeconds: parseInt(event.target.value) || undefined }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Passing score</Label>
                      <Input type="number" value={form.passingScore || 0} onChange={(event) => setForm((prev) => ({ ...prev, passingScore: parseInt(event.target.value) || 0 }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Max attempts</Label>
                      <Input type="number" value={form.maxAttempts || ""} onChange={(event) => setForm((prev) => ({ ...prev, maxAttempts: parseInt(event.target.value) || undefined }))} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingQuiz(null); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !form.title}>
                    {editingQuiz ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
        onEdit={openEdit}
        onDelete={(item) => {
          if (confirm("Delete this quiz?")) deleteMutation.mutate(item.id);
        }}
        extraActions={[
          {
            label: "Manage Questions",
            icon: FileQuestion,
            onClick: (item) => openQuestionManager(item.id),
          },
        ]}
      />

      {/* Question Management Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Questions</DialogTitle>
            <DialogDescription>Add, edit, or remove questions for this quiz.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Question List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Questions ({questionsData?.data?.length || 0})</h4>
              {questionsData?.data?.map((q, idx) => (
                <div key={q.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{q.type}</Badge>
                      <span className="text-sm font-medium truncate">{q.question}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {q.answers.filter(a => a.isCorrect).length} correct answer(s) • {q.points} point(s)
                    </div>
                  </div>
                  <div className="flex-shrink-0 gap-1 flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditQuestion(q)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                      if (confirm("Delete this question?")) {
                        deleteQuestionMutation.mutate({ quizId: selectedQuizId!, questionId: q.id });
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!questionsData?.data || questionsData.data.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No questions yet. Add one below.
                </div>
              )}
            </div>

            {/* Add/Edit Question Form */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-4">{editingQuestion ? "Edit Question" : "Add New Question"}</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Question Type</Label>
                  <SearchableSelect
                    value={questionForm.type}
                    onValueChange={(value) => setQuestionForm((prev) => ({ ...prev, type: value as QuestionType }))}
                    options={questionTypeOptions}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Question Text</Label>
                  <Textarea value={questionForm.question} onChange={(event) => setQuestionForm((prev) => ({ ...prev, question: event.target.value }))} placeholder="Enter the question..." />
                </div>
                
                <div className="grid gap-2">
                  <Label>Explanation (optional)</Label>
                  <Input value={questionForm.explanation || ""} onChange={(event) => setQuestionForm((prev) => ({ ...prev, explanation: event.target.value }))} placeholder="Explain the correct answer..." />
                </div>
                
                <div className="grid gap-2">
                  <Label>Points</Label>
                  <Input type="number" min={1} value={questionForm.points || 1} onChange={(event) => setQuestionForm((prev) => ({ ...prev, points: parseInt(event.target.value) || 1 }))} className="w-24" />
                </div>

                <div className="grid gap-2">
                  <Label>Answers</Label>
                  <div className="space-y-2">
                    {questionForm.answers.map((answer, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={answer.isCorrect ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => {
                            const newAnswers = questionForm.answers.map((a, i) => ({
                              ...a,
                              isCorrect: questionForm.type === "MULTIPLE_CHOICE" ? a.isCorrect : i === idx,
                            }));
                            setQuestionForm((prev) => ({ ...prev, answers: newAnswers }));
                          }}
                        >
                          {answer.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </Button>
                        <Input
                          value={answer.answer}
                          onChange={(event) => {
                            const newAnswers = [...questionForm.answers];
                            newAnswers[idx] = { ...newAnswers[idx], answer: event.target.value };
                            setQuestionForm((prev) => ({ ...prev, answers: newAnswers }));
                          }}
                          placeholder={`Answer ${idx + 1}`}
                          className="flex-1"
                        />
                        {questionForm.answers.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 text-destructive"
                            onClick={() => {
                              setQuestionForm((prev) => ({
                                ...prev,
                                answers: prev.answers.filter((_, i) => i !== idx),
                              }));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setQuestionForm((prev) => ({
                          ...prev,
                          answers: [
                            ...prev.answers,
                            { answer: "", isCorrect: false, orderIndex: prev.answers.length },
                          ],
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Answer
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the checkmark icon to mark correct answers. For single choice, only one can be correct.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsQuestionDialogOpen(false); resetQuestionForm(); }}>
              Close
            </Button>
            {editingQuestion && (
              <Button variant="outline" onClick={resetQuestionForm}>
                Add New
              </Button>
            )}
            <Button onClick={handleQuestionSubmit} disabled={addQuestionMutation.isPending || updateQuestionMutation.isPending}>
              {editingQuestion ? "Update Question" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
