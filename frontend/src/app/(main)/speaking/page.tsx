'use client';

import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponse } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSpeakingResultSocket } from '@/hooks/use-socket.hook';

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
  accuracyScore?: number;
  overallScore?: number;
  processingStatus: string;
  feedback?: string;
  createdAt: string;
}

type ProcessingStep = 'idle' | 'uploading' | 'submitting' | 'processing' | 'completed' | 'error';

export default function SpeakingPage() {
  const queryClient = useQueryClient();
  const [selectedExercise, setSelectedExercise] = useState<SpeakingExercise | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultData, setResultData] = useState<SpeakingAttempt | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use ref to store callback for socket listener
  const handleResultReceivedRef = useRef<((data: { attemptId: string; score: number; xpEarned: number }) => void) | null>(null);

  // Real-time status updates via WebSocket
  useSpeakingResultSocket((data) => {
    if (handleResultReceivedRef.current && data.attemptId === currentAttemptId) {
      handleResultReceivedRef.current(data);
    }
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
      }
    };
  }, []);

  // Handle result received from WebSocket
  const handleResultReceived = async (data: { attemptId: string; score: number; xpEarned: number }) => {
    try {
      const response = await api.get<ApiResponse<SpeakingAttempt>>(`/speaking/attempts/${data.attemptId}`);
      const attempt = response.data.data;
      
      setResultData(attempt);
      setProcessingStep('completed');
      setProcessingProgress(100);
      
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
      }
      
      toast.success('Analysis complete!', {
        description: `Score: ${attempt.overallScore || data.score}/100`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['speaking', 'attempts'] });
    } catch (error) {
      console.error('Failed to fetch result:', error);
    }
  };

  // Update ref when callback changes
  useEffect(() => {
    handleResultReceivedRef.current = handleResultReceived;
  }, [handleResultReceived]);

  const startProgressAnimation = () => {
    let progress = 0;
    const steps = [
      { target: 25, label: 'Uploading audio...' },
      { target: 50, label: 'Submitting...' },
      { target: 75, label: 'Processing speech...' },
      { target: 90, label: 'Analyzing results...' },
    ];
    
    let currentStepIndex = 0;
    
    processingTimerRef.current = setInterval(() => {
      progress += Math.random() * 5 + 2;
      if (progress > 100) progress = 100;
      setProcessingProgress(Math.min(progress, 95));
      
      // Update step based on progress
      while (currentStepIndex < steps.length && progress >= steps[currentStepIndex].target) {
        currentStepIndex++;
      }
    }, 500);
  };

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['speaking', 'exercises'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SpeakingExercise[]>>('/speaking/exercises');
      return response.data.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ exerciseId, audioUrl }: { exerciseId: string; audioUrl: string }) => {
      const response = await api.post<ApiResponse<{ attemptId: string; status: string }>>(
        `/speaking/exercises/${exerciseId}/submit`,
        { audioUrl }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentAttemptId(data.data.attemptId);
      setProcessingStep('processing');
      startProgressAnimation();
      
      toast.success('Recording submitted!', {
        description: 'Analyzing your pronunciation...',
      });
    },
    onError: () => {
      setProcessingStep('error');
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

    setProcessingStep('uploading');
    setProcessingProgress(0);
    setResultData(null);

    const formData = new FormData();
    formData.append('file', audioBlob, `speaking-${selectedExercise.id}.webm`);
    formData.append('folder', 'speaking');

    try {
      const uploadResponse = await api.post<ApiResponse<{ url: string }>>(
        '/media/upload/audio',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setProcessingStep('submitting');

      submitMutation.mutate({
        exerciseId: selectedExercise.id,
        audioUrl: uploadResponse.data.data.url,
      });
    } catch (error) {
      setProcessingStep('error');
      toast.error('Failed to upload audio');
    }
  };

  const handleCloseResult = () => {
    setResultData(null);
    setProcessingStep('idle');
    setCurrentAttemptId(null);
    setSelectedExercise(null);
    setAudioBlob(null);
    setProcessingProgress(0);
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
    // Show result modal when processing is complete
    if (resultData) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCloseResult}>
              Back to Exercises
            </Button>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleCloseResult}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {resultData.overallScore || 0}
                </div>
                <p className="text-muted-foreground">Overall Score</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-semibold">
                    {resultData.pronunciationScore ?? '-'}
                  </div>
                  <p className="text-sm text-muted-foreground">Pronunciation</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-semibold">
                    {resultData.fluencyScore ?? '-'}
                  </div>
                  <p className="text-sm text-muted-foreground">Fluency</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-semibold">
                    {resultData.accuracyScore ?? '-'}
                  </div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
              </div>

              {resultData.feedback && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Feedback</h4>
                  <p className="text-sm text-muted-foreground">{resultData.feedback}</p>
                </div>
              )}

              {resultData.transcript && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Transcript</h4>
                  <p className="text-sm text-muted-foreground italic">{resultData.transcript}</p>
                </div>
              )}

              <Button onClick={handleCloseResult} className="w-full">
                Continue Practicing
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show processing status
    if (processingStep === 'processing' || processingStep === 'uploading' || processingStep === 'submitting') {
      const getStatusText = () => {
        switch (processingStep) {
          case 'uploading': return 'Uploading audio...';
          case 'submitting': return 'Submitting recording...';
          case 'processing': return 'Analyzing your pronunciation...';
          default: return 'Processing...';
        }
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => {
              if (processingStep !== 'processing') {
                handleCloseResult();
              }
            }} disabled={processingStep === 'processing'}>
              Cancel
            </Button>
            <h2 className="text-xl font-semibold">{selectedExercise.title}</h2>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-medium">{getStatusText()}</h3>
                  <p className="text-sm text-muted-foreground">
                  Real-time feedback is being generated for your submission
                  </p>
                </div>

                <div className="max-w-xs mx-auto space-y-2">
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{Math.round(processingProgress)}%</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Connected via real-time socket</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show error state
    if (processingStep === 'error') {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCloseResult}>
              Back
            </Button>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                  </div>
                </div>
                <h3 className="text-xl font-medium text-destructive">Processing Failed</h3>
                <p className="text-sm text-muted-foreground">
                  There was an error processing your submission. Please try again.
                </p>
                <Button onClick={handleCloseResult}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Default: show recording interface
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
                    <Button onClick={handleSubmit} disabled={processingStep !== 'idle'}>
                      {processingStep !== 'idle' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
