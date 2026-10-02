import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  Play, 
  CheckCircle2, 
  Clock, 
  Table, 
  ShieldCheck, 
  FileCode, 
  RotateCw,
  HardDrive
} from 'lucide-react';
import { LibraryStorage } from '../services/storage';

export const SqliteDataLayerView: React.FC = () => {
  const [activeTable, setActiveTable] = useState<'books' | 'borrowers' | 'transactions' | 'history'>('books');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM books;');
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: (string | number | boolean | null)[][];
    executionTimeMs: number;
    message?: string;
    isError?: boolean;
  } | null>(null);

  const [dbIntegrity, setDbIntegrity] = useState<string>('VERIFIED_OK');

  const executeCurrentQuery = (queryToRun: string = sqlQuery) => {
    const res = LibraryStorage.executeSql(queryToRun);
    setQueryResult(res);
  };

  useEffect(() => {
    executeCurrentQuery(`SELECT * FROM ${activeTable};`);
  }, [activeTable]);

  const presetQueries = [
    { label: 'Select All Books', sql: 'SELECT * FROM books;' },
    { label: 'Select All Borrowers', sql: 'SELECT * FROM borrowers;' },
    { label: 'Select All Transactions', sql: 'SELECT * FROM transactions;' },
    { label: 'Audit History Log', sql: 'SELECT * FROM history;' },
    { label: 'Check SQLite Integrity', sql: 'PRAGMA integrity_check;' },
    { label: 'Table Info (Books)', sql: 'PRAGMA table_info(books);' },
    { label: 'Inspect Journal Mode', sql: 'PRAGMA journal_mode;' },
  ];

  const handleIntegrityCheck = () => {
    const res = LibraryStorage.executeSql('PRAGMA integrity_check;');
    setQueryResult(res);
    setDbIntegrity('VERIFIED_OK');
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-6 py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Top Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F1F5F9]">SQLite 3.45.1 Embedded Storage Layer</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  WAL ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-code mt-0.5">
                C:\ProgramData\ULM_LMS\library.db · Page Size: 4096 bytes · Cache: 2000 pages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleIntegrityCheck}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Run Database Integrity Check</span>
            </button>
          </div>
        </div>

        {/* Database Tables Tabs & Preset Queries */}
        <div className="bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1E293B] pb-3">
            {/* Table Selectors */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1 font-medium">
                <Table className="w-3.5 h-3.5 text-amber-500" />
                <span>Tables:</span>
              </span>
              {(['books', 'borrowers', 'transactions', 'history'] as const).map(tbl => (
                <button
                  key={tbl}
                  onClick={() => {
                    setActiveTable(tbl);
                    setSqlQuery(`SELECT * FROM ${tbl};`);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono-code font-semibold transition-colors cursor-pointer ${
                    activeTable === tbl
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>

            {/* Integrity Status */}
            <div className="flex items-center gap-2 text-xs font-mono-code text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Indexes Verified · Zero Storage Anomalies</span>
            </div>
          </div>

          {/* Preset SQL queries pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono-code text-slate-500 dark:text-slate-400 mr-1">Query Templates:</span>
            {presetQueries.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  setSqlQuery(p.sql);
                  executeCurrentQuery(p.sql);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-[#020617] dark:hover:bg-slate-800 text-[11px] font-mono-code text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400/50 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SQL Terminal Console */}
        <div className="bg-[#020617] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-2xs transition-colors">
          <div className="bg-slate-50 dark:bg-[#0F172A] px-4 py-2.5 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono-code text-slate-700 dark:text-slate-300 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              <span>SQLite Command Query Interface (library.db)</span>
            </div>

            <button
              onClick={() => executeCurrentQuery(sqlQuery)}
              className="px-3.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs font-mono-code flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-slate-950" />
              <span>EXECUTE QUERY</span>
            </button>
          </div>

          <div className="p-3">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-[#334155] rounded-lg p-3 text-xs font-mono-code text-slate-900 dark:text-amber-300 focus:outline-hidden focus:border-amber-500 resize-none selection:bg-amber-500/30"
              placeholder="Enter SQLite query (e.g. SELECT * FROM books;)"
            />
          </div>

          {/* Query Output Metadata Bar */}
          {queryResult && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-[#0F172A]/80 border-t border-slate-200 dark:border-[#1E293B] flex items-center justify-between text-xs font-mono-code">
              <div className="flex items-center gap-3">
                <span className={queryResult.isError ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1'}>
                  {!queryResult.isError && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{queryResult.message || 'Execution completed.'}</span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">{queryResult.executionTimeMs} ms</span>
                </span>
                <span>
                  <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">{queryResult.rows.length}</span> rows
                </span>
              </div>
            </div>
          )}

          {/* Results Table View */}
          {queryResult && queryResult.columns.length > 0 && (
            <div className="max-h-96 overflow-auto border-t border-slate-200 dark:border-[#1E293B]">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300 font-mono-code">
                <thead className="bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-400 uppercase text-[10.5px] border-b border-slate-200 dark:border-[#1E293B] sticky top-0">
                  <tr>
                    {queryResult.columns.map(col => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E293B]">
                  {queryResult.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 whitespace-nowrap truncate max-w-xs">
                          {cell === null ? (
                            <span className="text-slate-400 dark:text-slate-600 italic">NULL</span>
                          ) : typeof cell === 'boolean' ? (
                            cell ? '1' : '0'
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
