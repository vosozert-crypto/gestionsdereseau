import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { api } from '../services/api.ts';
import { NetworkDevice, SecurityLog, DeviceCategory, DeviceType, DeviceStatus } from '../types.ts';

interface DeviceState {
  devices: NetworkDevice[];
  logs: SecurityLog[];
  kpi: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
}

type DeviceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEVICES'; payload: { devices: NetworkDevice[]; pagination: DeviceState['pagination'] } }
  | { type: 'ADD_DEVICE'; payload: NetworkDevice }
  | { type: 'UPDATE_DEVICE'; payload: NetworkDevice }
  | { type: 'REMOVE_DEVICE'; payload: string }
  | { type: 'CLEAR_DEVICES' }
  | { type: 'SET_LOGS'; payload: SecurityLog[] }
  | { type: 'ADD_LOG'; payload: SecurityLog }
  | { type: 'SET_KPI'; payload: Record<string, unknown> };

function deviceReducer(state: DeviceState, action: DeviceAction): DeviceState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_DEVICES':
      return { ...state, devices: action.payload.devices, pagination: action.payload.pagination, isLoading: false, error: null };
    case 'ADD_DEVICE':
      return { ...state, devices: [action.payload, ...state.devices] };
    case 'UPDATE_DEVICE':
      return { ...state, devices: state.devices.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'REMOVE_DEVICE':
      return { ...state, devices: state.devices.filter(d => d.id !== action.payload) };
    case 'CLEAR_DEVICES':
      return { ...state, devices: [], pagination: null };
    case 'SET_LOGS':
      return { ...state, logs: action.payload };
    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs] };
    case 'SET_KPI':
      return { ...state, kpi: action.payload };
    default:
      return state;
  }
}

interface DeviceContextType extends DeviceState {
  fetchDevices: (params?: Record<string, string>) => Promise<void>;
  fetchDevice: (id: string) => Promise<NetworkDevice | null>;
  addDevice: (data: Record<string, unknown>) => Promise<void>;
  updateDevice: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  clearDevices: () => Promise<void>;
  fetchLogs: (params?: Record<string, string>) => Promise<void>;
  fetchKpi: () => Promise<void>;
  dispatch: React.Dispatch<DeviceAction>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(deviceReducer, {
    devices: [],
    logs: [],
    kpi: null,
    isLoading: true,
    error: null,
    pagination: null,
  });

  const fetchDevices = useCallback(async (params: Record<string, string> = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.getDevices(params);
      dispatch({ type: 'SET_DEVICES', payload: { devices: data.devices, pagination: data.pagination } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    }
  }, []);

  const fetchDevice = useCallback(async (id: string): Promise<NetworkDevice | null> => {
    try {
      return await api.getDevice(id);
    } catch {
      return null;
    }
  }, []);

  const addDevice = useCallback(async (data: Record<string, unknown>) => {
    const device = await api.createDevice(data);
    dispatch({ type: 'ADD_DEVICE', payload: device });
  }, []);

  const updateDevice = useCallback(async (id: string, data: Record<string, unknown>) => {
    const device = await api.updateDevice(id, data);
    dispatch({ type: 'UPDATE_DEVICE', payload: device });
  }, []);

  const deleteDevice = useCallback(async (id: string) => {
    await api.deleteDevice(id);
    dispatch({ type: 'REMOVE_DEVICE', payload: id });
  }, []);

  const clearDevices = useCallback(async () => {
    await api.clearDevices();
    dispatch({ type: 'CLEAR_DEVICES' });
  }, []);

  const fetchLogs = useCallback(async (params: Record<string, string> = {}) => {
    try {
      const data = await api.getLogs(params);
      dispatch({ type: 'SET_LOGS', payload: data.logs });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    }
  }, []);

  const fetchKpi = useCallback(async () => {
    try {
      const data = await api.getDashboardKpi();
      dispatch({ type: 'SET_KPI', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchLogs();
    fetchKpi();
  }, [fetchDevices, fetchLogs, fetchKpi]);

  return (
    <DeviceContext.Provider value={{
      ...state,
      fetchDevices,
      fetchDevice,
      addDevice,
      updateDevice,
      deleteDevice,
      clearDevices,
      fetchLogs,
      fetchKpi,
      dispatch,
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
}
