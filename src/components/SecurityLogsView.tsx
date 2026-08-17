import React from 'react';
import { Shield, AlertTriangle, Info, Terminal, Download } from 'lucide-react';
import { SecurityLog, Language } from '../types';
import { getTranslation } from '../data/i18n';

interface SecurityLogsViewProps {
  logs: SecurityLog[];
  lang: Language;
}

export const SecurityLogsView: React.FC<SecurityLogsViewProps> = ({ logs = [], lang }) => {
  const t = getTranslation(lang);
  const safeLogs = logs || [];

  return (
    <div className="bg-white rounded border border-[#DEE2E6] flex flex-col h-full shadow-xs overflow-hidden">
      <div className="bg-[#F8F9FA] px-4 py-3 border-b border-[#DEE2E6] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-600" />
          <h2 className="text-xs font-bold uppercase text-gray-800 tracking-wider">
            {t.security}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-gray-500">
          Real-time Syslog Buffer (SNMP/802.1X)
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
        {safeLogs.map((log) => (
          <div
            key={log.id}
            className={`p-3 rounded border flex items-start justify-between gap-3 ${
              log.severity === 'CRITICAL'
                ? 'bg-red-50 border-red-200 text-red-900'
                : log.severity === 'WARNING'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {log.severity === 'CRITICAL' ? (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : log.severity === 'WARNING' ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10">
                    [{log.severity}]
                  </span>
                  <span>{lang === 'ar' ? log.messageAr : log.message}</span>
                </div>
                <div className="text-[10px] opacity-75 mt-1">
                  Source: <strong>{log.sourceIp}</strong> • Protocol: <strong>{log.protocol}</strong>
                </div>
              </div>
            </div>

            <span className="text-[10px] opacity-60 shrink-0 font-mono">{log.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
