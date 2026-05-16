'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { tokenStorage } from '@/stores/token-storage';
import { getSocket, disconnectSocket, AppSocket } from '@/lib/socket';

export function useSocket() {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  const accessToken = tokenStorage.getAccessToken();

  useEffect(() => {
    if (user && accessToken) {
      const socketInstance = getSocket(accessToken);

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    }
  }, [user, accessToken]);

  return { socket, isConnected };
}

// ========== LEADERBOARD ==========

export function useLeaderboardSocket(onUpdate?: (data: any) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected) {
      if (onUpdate) {
        socket.on('leaderboard:update', onUpdate);
      }
    }

    return () => {
      if (onUpdate) {
        socket?.off('leaderboard:update', onUpdate);
      }
    };
  }, [socket, isConnected, onUpdate]);

  return { isConnected };
}

// ========== NOTIFICATIONS ==========

export function useNotificationSocket(
  onNotification?: (notification: {
    id: string;
    type: string;
    title: string;
    message: string;
  }) => void,
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected && onNotification) {
      socket.on('notification', onNotification);

      return () => {
        socket.off('notification', onNotification);
      };
    }
  }, [socket, isConnected, onNotification]);

  return { isConnected };
}

// ========== SPEAKING RESULTS ==========

export function useSpeakingResultSocket(
  onResult?: (data: {
    attemptId: string;
    score: number;
    feedback: string;
  }) => void,
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected && onResult) {
      socket.on('speaking:result', onResult);

      return () => {
        socket.off('speaking:result', onResult);
      };
    }
  }, [socket, isConnected, onResult]);

  return { isConnected };
}

// ========== QUIZ RESULTS ==========

export function useQuizResultSocket(
  onResult?: (data: {
    quizId: string;
    score: number;
    xpEarned: number;
  }) => void,
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected && onResult) {
      socket.on('quiz:result', onResult);

      return () => {
        socket.off('quiz:result', onResult);
      };
    }
  }, [socket, isConnected, onResult]);

  return { isConnected };
}

// ========== XP UPDATES ==========

export function useXpSocket(
  onUpdate?: (data: { xp: number; source: string }) => void,
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected && onUpdate) {
      socket.on('xp:update', onUpdate);

      return () => {
        socket.off('xp:update', onUpdate);
      };
    }
  }, [socket, isConnected, onUpdate]);

  return { isConnected };
}

// ========== STREAK UPDATES ==========

export function useStreakSocket(
  onUpdate?: (data: { streakDays: number }) => void,
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected && onUpdate) {
      socket.on('streak:update', onUpdate);

      return () => {
        socket.off('streak:update', onUpdate);
      };
    }
  }, [socket, isConnected, onUpdate]);

  return { isConnected };
}

// ========== ACHIEVEMENTS ==========

export function useAchievementSocket(
  onUnlock?: (achievement: any) => void,
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected && onUnlock) {
      socket.on('achievement:unlocked', onUnlock);

      return () => {
        socket.off('achievement:unlocked', onUnlock);
      };
    }
  }, [socket, isConnected, onUnlock]);

  return { isConnected };
}

// ========== ROOM CHAT ==========

export function useSocketRoom(roomId: string | null) {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const joinRoom = useCallback(() => {
    if (socket && isConnected && roomId) {
      socket.emit('join:room', { roomId });
    }
  }, [socket, isConnected, roomId]);

  const leaveRoom = useCallback(() => {
    if (socket && isConnected && roomId) {
      socket.emit('leave:room', { roomId });
    }
  }, [socket, isConnected, roomId]);

  const sendMessage = useCallback((message: string, type: string = 'chat') => {
    if (socket && isConnected && roomId) {
      socket.emit('chat:message', { roomId, message, type });
    }
  }, [socket, isConnected, roomId]);

  const startTyping = useCallback((type: string = 'chat') => {
    if (socket && isConnected && roomId) {
      socket.emit('typing:start', { roomId, type });
    }
  }, [socket, isConnected, roomId]);

  const stopTyping = useCallback((type: string = 'chat') => {
    if (socket && isConnected && roomId) {
      socket.emit('typing:stop', { roomId, type });
    }
  }, [socket, isConnected, roomId]);

  useEffect(() => {
    if (socket && isConnected && roomId) {
      // Join room on mount
      joinRoom();

      // Listen for typing updates
      const handleTypingUpdate = (data: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.isTyping,
        }));
      };

      socket.on('user:typing', handleTypingUpdate);

      // Cleanup
      return () => {
        leaveRoom();
        socket.off('user:typing', handleTypingUpdate);
      };
    }
  }, [socket, isConnected, roomId, joinRoom, leaveRoom]);

  return {
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
  };
}

// ========== ONLINE USERS ==========

export function useOnlineUsers() {
  const { socket, isConnected } = useSocket();
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (socket && isConnected) {
      const handleOnlineUpdate = (data: { count: number }) => {
        setOnlineCount(data.count);
      };

      socket.on('users:online', handleOnlineUpdate);

      return () => {
        socket.off('users:online', handleOnlineUpdate);
      };
    }
  }, [socket, isConnected]);

  return { onlineCount };
}
