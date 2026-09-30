import React, { useState } from 'react';
import { 
  Cpu, 
  FileCode, 
  Folder, 
  Copy, 
  Check, 
  Layers, 
  Download, 
  Terminal, 
  Code2 
} from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  lang: string;
  code: string;
}

const NATIVE_FILES: CodeFile[] = [
  {
    path: 'CMakeLists.txt',
    name: 'CMakeLists.txt',
    lang: 'cmake',
    code: `cmake_minimum_required(VERSION 3.22)
project(UniversityOfLakkiMarwatLMS VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Enable Qt 6 MOC, UIC, RCC
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt6 REQUIRED COMPONENTS Core Gui Widgets Sql PrintSupport)
find_package(SQLite3 REQUIRED)

add_executable(LibraryManagementSystem
    src/main.cpp
    src/core/Application.cpp
    src/core/Application.h
    src/database/DatabaseManager.cpp
    src/database/DatabaseManager.h
    src/database/MigrationManager.cpp
    src/repositories/BookRepository.cpp
    src/repositories/BorrowerRepository.cpp
    src/repositories/TransactionRepository.cpp
    src/services/BookService.cpp
    src/services/BorrowerService.cpp
    src/services/TransactionService.cpp
    src/services/BarcodeService.cpp
    src/ui/MainWindow.cpp
    src/ui/MainWindow.h
    src/ui/DashboardPage.cpp
    src/ui/BooksCatalogPage.cpp
    src/ui/CirculationDeskPage.cpp
    src/ui/BarcodeScannerPage.cpp
)

target_link_libraries(LibraryManagementSystem PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Sql
    Qt6::PrintSupport
    SQLite::SQLite3
)

# Windows 11 Manifest & High-DPI
if(WIN32)
    set_target_properties(LibraryManagementSystem PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()`
  },
  {
    path: 'src/main.cpp',
    name: 'main.cpp',
    lang: 'cpp',
    code: `#include <QApplication>
#include <QStyleFactory>
#include <QDir>
#include <QStandardPaths>
#include "core/Application.h"
#include "database/DatabaseManager.h"
#include "ui/MainWindow.h"

int main(int argc, char *argv[]) {
    // Windows 11 High-DPI Per-Monitor V2
    QApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    QApplication app(argc, argv);
    app.setApplicationName("University of Lakki Marwat LMS");
    app.setOrganizationName("UniversityOfLakkiMarwat");
    app.setApplicationVersion("1.0.0");

    // Initialize Local SQLite Data Directory
    QString dataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(dataPath);
    QString dbPath = dataPath + "/library.db";

    if (!ulm::DatabaseManager::instance().initialize(dbPath)) {
        qCritical() << "Fatal: Failed to mount SQLite WAL database at" << dbPath;
        return 1;
    }

    ulm::MainWindow window;
    window.resize(1920, 1080);
    window.show();

    return app.exec();
}`
  },
  {
    path: 'src/database/DatabaseManager.h',
    name: 'DatabaseManager.h',
    lang: 'cpp',
    code: `#pragma once
#include <QString>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <memory>
#include <mutex>

namespace ulm {

class DatabaseManager {
public:
    static DatabaseManager& instance();

    bool initialize(const QString& dbPath);
    bool checkIntegrity();
    bool executeMigration();
    QSqlDatabase& database();

    // Transaction RAII Guard
    class ScopedTransaction {
    public:
        ScopedTransaction(QSqlDatabase& db);
        ~ScopedTransaction();
        void commit();
    private:
        QSqlDatabase& m_db;
        bool m_committed{false};
    };

private:
    DatabaseManager() = default;
    ~DatabaseManager() = default;
    DatabaseManager(const DatabaseManager&) = delete;
    DatabaseManager& operator=(const DatabaseManager&) = delete;

    QSqlDatabase m_db;
    std::mutex m_mutex;
};

}`
  },
  {
    path: 'src/services/TransactionService.cpp',
    name: 'TransactionService.cpp',
    lang: 'cpp',
    code: `#include "TransactionService.h"
#include "database/DatabaseManager.h"
#include <QDateTime>
#include <QSqlError>

namespace ulm {

bool TransactionService::issueBook(const QString& bookId, const QString& borrowerId, int days) {
    auto& db = DatabaseManager::instance().database();
    DatabaseManager::ScopedTransaction tx(db);

    // 1. Verify Available Quantity > 0
    QSqlQuery checkQuery(db);
    checkQuery.prepare("SELECT available_quantity, total_quantity FROM books WHERE id = :id AND is_active = 1");
    checkQuery.bindValue(":id", bookId);
    if (!checkQuery.exec() || !checkQuery.next()) return false;

    int available = checkQuery.value(0).toInt();
    if (available <= 0) return false;

    // 2. Strict Rule: Available = Available - 1
    QSqlQuery updateQuery(db);
    updateQuery.prepare("UPDATE books SET available_quantity = available_quantity - 1 WHERE id = :id");
    updateQuery.bindValue(":id", bookId);
    if (!updateQuery.exec()) return false;

    // 3. Insert Issue Transaction Record
    QSqlQuery insertQuery(db);
    insertQuery.prepare(R"(
        INSERT INTO transactions (id, book_id, borrower_id, action, issue_date, due_date, status)
        VALUES (:id, :book_id, :borrower_id, 'ISSUE', :issue_date, :due_date, 'ACTIVE')
    )");
    
    QString txId = "tx-" + QString::number(QDateTime::currentMSecsSinceEpoch());
    QString today = QDate::currentDate().toString(Qt::ISODate);
    QString due = QDate::currentDate().addDays(days).toString(Qt::ISODate);

    insertQuery.bindValue(":id", txId);
    insertQuery.bindValue(":book_id", bookId);
    insertQuery.bindValue(":borrower_id", borrowerId);
    insertQuery.bindValue(":issue_date", today);
    insertQuery.bindValue(":due_date", due);

    if (!insertQuery.exec()) return false;

    tx.commit();
    return true;
}

}`
  },
  {
    path: 'database/schema.sql',
    name: 'schema.sql',
    lang: 'sql',
    code: `-- University of Lakki Marwat LMS SQLite Schema
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    barcode TEXT NOT NULL UNIQUE,
    isbn TEXT NOT NULL,
    book_name TEXT NOT NULL,
    author TEXT NOT NULL,
    publisher TEXT,
    category TEXT NOT NULL,
    edition TEXT,
    publication_year INTEGER,
    language TEXT DEFAULT 'English',
    description TEXT,
    book_image_path TEXT,
    total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= total_quantity),
    shelf TEXT,
    row TEXT,
    section TEXT,
    dewey_call_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS borrowers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    program TEXT,
    class_name TEXT,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES books(id),
    borrower_id TEXT NOT NULL REFERENCES borrowers(id),
    action TEXT NOT NULL CHECK (action IN ('ISSUE', 'RETURN', 'ADD', 'REMOVE', 'ADJUST')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RETURNED', 'OVERDUE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_barcode ON books(barcode);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_borrowers_student_id ON borrowers(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);`
  }
];

export const CppNativeView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(NATIVE_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const combined = NATIVE_FILES.map(f => `=== FILE: ${f.path} ===\n\n${f.code}\n\n`).join('\n');
    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ULM_LMS_Cpp20_Qt6_SourceBundle.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 w-full bg-fluent-matrix px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>C++20 & Qt 6 Native Architecture Reference</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  DESKTOP NATIVE
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-code mt-0.5">
                Target: Windows x64 .exe · CMake 3.22+ · Qt 6.7 Widgets · MSVC / Clang 18
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Download Source Bundle</span>
            </button>
          </div>
        </div>

        {/* Architecture Layers Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 bg-white dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200 dark:border-[#1E293B] shadow-2xs transition-colors">
          <div className="bg-slate-50 dark:bg-[#020617] p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] text-center">
            <span className="text-[10px] font-mono-code text-amber-600 dark:text-amber-400 font-bold block">LAYER 1</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Qt 6 Widgets UI</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">MainWindow, Views, Forms</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#020617] p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] text-center">
            <span className="text-[10px] font-mono-code text-amber-600 dark:text-amber-400 font-bold block">LAYER 2</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Application Core</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">App lifecycle & High-DPI</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#020617] p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] text-center">
            <span className="text-[10px] font-mono-code text-amber-600 dark:text-amber-400 font-bold block">LAYER 3</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Service Layer</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Rules, Barcode, Circulation</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#020617] p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] text-center">
            <span className="text-[10px] font-mono-code text-amber-600 dark:text-amber-400 font-bold block">LAYER 4</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Repositories</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Data Access & Entities</p>
          </div>
          <div className="bg-slate-50 dark:bg-[#020617] p-2.5 rounded-lg border border-slate-200 dark:border-[#334155] text-center col-span-2 md:col-span-1">
            <span className="text-[10px] font-mono-code text-emerald-600 dark:text-emerald-400 font-bold block">LAYER 5</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">SQLite Engine</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">WAL Mode, B-Trees, ACID</p>
          </div>
        </div>

        {/* Source File Browser & Code Editor Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Tree Column */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 space-y-2 shadow-2xs transition-colors">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-[#1E293B]">
              <Folder className="w-4 h-4 text-amber-500" />
              <span>Project Sources</span>
            </div>

            <div className="space-y-1">
              {NATIVE_FILES.map(file => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono-code flex items-center gap-2 transition-colors cursor-pointer ${
                    selectedFile.path === file.path
                      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              ))}
            </div>

            {/* Build commands snippet */}
            <div className="pt-4 border-t border-slate-200 dark:border-[#1E293B] space-y-1.5">
              <span className="text-[10px] font-mono-code text-slate-500 dark:text-slate-400 uppercase font-semibold">Build & Compile:</span>
              <div className="p-2.5 rounded bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 text-[11px] font-mono-code text-slate-700 dark:text-slate-300 space-y-1">
                <p className="text-amber-600 dark:text-amber-400">cmake -S . -B build</p>
                <p className="text-amber-600 dark:text-amber-400">cmake --build build --config Release</p>
                <p className="text-emerald-600 dark:text-emerald-400 mt-1"># Output: LibraryManagementSystem.exe</p>
              </div>
            </div>
          </div>

          {/* Code Viewer Column */}
          <div className="lg:col-span-3 bg-white dark:bg-[#020617] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-2xs flex flex-col transition-colors">
            <div className="bg-slate-50 dark:bg-[#0F172A] px-4 py-2.5 border-b border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono-code text-slate-900 dark:text-white font-semibold">
                <Code2 className="w-4 h-4 text-amber-500" />
                <span>{selectedFile.path}</span>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono-code flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy Source'}</span>
              </button>
            </div>

            <div className="p-4 overflow-auto max-h-[560px] bg-slate-50/50 dark:bg-[#020617]">
              <pre className="font-mono-code text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {selectedFile.code.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row">
                    <span className="table-cell pr-4 text-right select-none text-slate-400 dark:text-slate-600 font-mono-code text-[11px] tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="table-cell whitespace-pre">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
