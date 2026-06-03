'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookMarked, Edit3, Pin, Plus, Search, StickyNote, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import { notesApi, NoteType, SaveNotePayload, UserNote } from '@/features/notes/api/notes.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils';

const noteTypes: Array<{ value: NoteType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'PHRASE', label: 'Phrase' },
  { value: 'LESSON', label: 'Lesson' },
  { value: 'QUIZ_MISTAKE', label: 'Quiz mistake' },
  { value: 'SPEAKING_FEEDBACK', label: 'Speaking' },
];

const emptyForm: SaveNotePayload = {
  title: '',
  content: '',
  type: 'CUSTOM',
  tags: [],
  color: '',
  isPinned: false,
  isArchived: false,
};

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [type, setType] = useState<NoteType | 'ALL'>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  const [form, setForm] = useState<SaveNotePayload>(emptyForm);
  const [tagText, setTagText] = useState('');

  const queryParams = useMemo(
    () => ({
      q: q || undefined,
      type: type === 'ALL' ? undefined : type,
      isArchived: showArchived,
      limit: 50,
    }),
    [q, showArchived, type],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['notes', queryParams],
    queryFn: () => notesApi.getNotes(queryParams),
  });

  const notes = data?.data || [];

  const invalidateNotes = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: SaveNotePayload & { id?: string }) =>
      payload.id
        ? notesApi.updateNote({ ...payload, id: payload.id })
        : notesApi.createNote(payload),
    onSuccess: () => {
      toast.success(editingNote ? 'Note updated' : 'Note created');
      invalidateNotes();
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: () => {
      toast.success('Note deleted');
      invalidateNotes();
    },
  });

  const updateMutation = useMutation({
    mutationFn: notesApi.updateNote,
    onSuccess: () => {
      invalidateNotes();
    },
  });

  const flashcardMutation = useMutation({
    mutationFn: notesApi.createFlashcard,
    onSuccess: () => {
      toast.success('Flashcard created from note');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Only vocabulary notes can create flashcards');
    },
  });

  const openCreateDialog = () => {
    setEditingNote(null);
    setForm(emptyForm);
    setTagText('');
    setDialogOpen(true);
  };

  const openEditDialog = (note: UserNote) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      content: note.content,
      type: note.type,
      sourceType: note.sourceType,
      sourceId: note.sourceId,
      tags: note.tags,
      color: note.color || '',
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      reviewAt: note.reviewAt,
    });
    setTagText(note.tags.join(', '));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingNote(null);
    setForm(emptyForm);
    setTagText('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title?.trim() || !form.content?.trim()) {
      toast.error('Title and content are required');
      return;
    }

    saveMutation.mutate({
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      tags: parseTags(tagText),
      id: editingNote?.id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <StickyNote className="h-8 w-8" />
            Notes
          </h1>
          <p className="mt-1 text-muted-foreground">
            Save vocabulary, grammar points, lesson snippets, and mistakes for review.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New note
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-md border bg-card p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search notes"
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={(value) => setType(value as NoteType | 'ALL')}>
          <SelectTrigger className="md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {noteTypes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived((value) => !value)}
        >
          {showArchived ? (
            <ArchiveRestore className="mr-2 h-4 w-4" />
          ) : (
            <Archive className="mr-2 h-4 w-4" />
          )}
          {showArchived ? 'Archived' : 'Active'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-md" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BookMarked className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">No notes yet</h2>
              <p className="text-sm text-muted-foreground">
                Capture anything worth reviewing later.
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create first note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={cn(
                'overflow-hidden',
                note.isPinned && 'border-primary/50 shadow-sm',
              )}
              style={note.color ? { borderTopColor: note.color, borderTopWidth: 4 } : undefined}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-2 text-base">{note.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      updateMutation.mutate({
                        id: note.id,
                        title: note.title,
                        content: note.content,
                        isPinned: !note.isPinned,
                      })
                    }
                    aria-label="Toggle pin"
                  >
                    <Pin className={cn('h-4 w-4', note.isPinned && 'fill-current text-primary')} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{note.type.replaceAll('_', ' ')}</Badge>
                  {note.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-5 whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.content}
                </p>
                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.updatedAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    {note.sourceType === 'VOCABULARY' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => flashcardMutation.mutate(note.id)}
                      >
                        Flashcard
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(note)}
                      aria-label="Edit note"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => deleteMutation.mutate(note.id)}
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit note' : 'New note'}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <Input
                value={form.title}
                onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))}
                placeholder="Title"
              />
              <Select
                value={form.type || 'CUSTOM'}
                onValueChange={(value) => setForm((current) => ({ ...current, type: value as NoteType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes
                    .filter((item) => item.value !== 'ALL')
                    .map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              value={form.content}
              onChange={(event) => setForm((value) => ({ ...value, content: event.target.value }))}
              placeholder="Write the detail you want to remember"
              className="min-h-48"
            />

            <div className="grid gap-4 md:grid-cols-[1fr_160px]">
              <Input
                value={tagText}
                onChange={(event) => setTagText(event.target.value)}
                placeholder="Tags separated by commas"
              />
              <Input
                value={form.color || ''}
                onChange={(event) => setForm((value) => ({ ...value, color: event.target.value }))}
                placeholder="#2563eb"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {editingNote ? 'Save changes' : 'Create note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
