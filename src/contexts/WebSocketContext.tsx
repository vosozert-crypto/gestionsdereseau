import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../services/api.ts';

interface LiveMetrics {
  timestamp: string;
  onlineCount: number;
  avgLatency: number;
  systemLoad: { cpu: number; memory: number };
}

interface ScanProgress {
  currentIp: string;
  scanned: number;
  total: number;
  discovered: number;
  percent: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  liveMetrics: LiveMetrics | null;
  scanProgress: ScanProgress | null;
  connect: () => void;
  disconnect: () => void;
  subscribeToMetrics: () => void;
  subscribeToDevices: () => void;
  subscribeToLogs: () => void;
  subscribeToScan: (scanId: string) => void;
  onDeviceStatusChange: (callback: (data: any) => void) => () => void;
  onNewLog: (callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socket.on('metrics:live', (data: LiveMetrics) => {
      setLiveMetrics(data);
    });

    socket.on('scan:progress', (data: ScanProgress) => {
      setScanProgress(data);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const subscribeToMetrics = useCallback(() => {
    socketRef.current?.emit('subscribe:metrics');
  }, []);

  const subscribeToDevices = useCallback(() => {
    socketRef.current?.emit('subscribe:devices');
  }, []);

  const subscribeToLogs = useCallback(() => {
    socketRef.current?.emit('subscribe:logs');
  }, []);

  const subscribeToScan = useCallback((scanId: string) => {
    socketRef.current?.emit('subscribe:scan', scanId);
  }, []);

  const onDeviceStatusChange = useCallback((callback: (data: any) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('devices:status', callback);
    return () => { socketRef.current?.off('devices:status', callback); };
  }, []);

  const onNewLog = useCallback((callback: (data: any) => void) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on('logs:new', callback);
    return () => { socketRef.current?.off('logs:new', callback); };
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      liveMetrics,
      scanProgress,
      connect,
      disconnect,
      subscribeToMetrics,
      subscribeToDevices,
      subscribeToLogs,
      subscribeToScan,
      onDeviceStatusChange,
      onNewLog,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
