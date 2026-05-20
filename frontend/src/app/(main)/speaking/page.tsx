'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, ApiResponse } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Mic, Upload, Volume2, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SpeakingExercise {
  id: string;
  title: string;
  textContent: string;
  difficulty: number;
}

interface SpeakingAttempt {
  id: string;
  transcript?: string;
  pronunciationScore?: number;
  fluencyScore?: number;
  overallScore?: number;
  processingStatus: string;
  createdAt: string;
}

export default function SpeakingPage() {
  const [selectedExercise, setSelectedExercise] = useState<SpeakingExercise | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['speaking', 'exercises'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SpeakingExercise[]>>('/speaking/exercises');
      return response.data.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ exerciseId, audioUrl }: { exerciseId: string; audioUrl: string }) => {
      const response = await api.post<ApiResponse<SpeakingAttempt>>(
        `/speaking/exercises/${exerciseId}/submit`,
        { audioUrl }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Recording submitted successfully.');
      setSelectedExercise(null);
      setAudioBlob(null);
    },
    onError: () => {
      toast.error('Failed to submit recording');
    },
  });

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
      };

      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!selectedExercise || !audioBlob) return;

    const formData = new FormData();
    formData.append('file', audioBlob, `speaking-${selectedExercise.id}.webm`);
    formData.append('folder', 'speaking');

    const uploadResponse = await api.post<ApiResponse<{ url: string }>>(
      '/media/upload/audio',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    submitMutation.mutate({
      exerciseId: selectedExercise.id,
      audioUrl: uploadResponse.data.data.url,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (selectedExercise) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedExercise(null)}>
            Back
          </Button>
          <h2 className="text-xl font-semibold">{selectedExercise.title}</h2>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Read Aloud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted dark:bg-muted/50 rounded-lg text-center text-xl">
              {selectedExercise.textContent}
            </div>

            <div className="flex justify-center">
              {audioBlob ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Recording ready</span>
                  </div>
                  <audio controls src={URL.createObjectURL(audioBlob)} className="w-full max-w-md" />
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setAudioBlob(null)}>
                      Record Again
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                      {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Recording
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  variant={isRecording ? 'destructive' : 'default'}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className="rounded-full w-24 h-24"
                >
                  {isRecording ? (
                    <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs mt-1">Stop</span>
                    </div>
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {audioBlob
                ? 'Listen to your recording and submit when ready'
                : isRecording
                  ? 'Recording... Click stop when finished'
                  : 'Click the microphone to start recording'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Speaking Practice</h1>
        <p className="text-muted-foreground">
          Record yourself, save attempts, and review your practice history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {exercises?.map((exercise: SpeakingExercise) => (
          <Card
            key={exercise.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedExercise(exercise)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  {exercise.title}
                </CardTitle>
                <Badge variant="outline">Level {exercise.difficulty}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {exercise.textContent}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!exercises || exercises.length === 0) && (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No speaking exercises available yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
