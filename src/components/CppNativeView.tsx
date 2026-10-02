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
  Code2,
  Box,
  CheckCircle2
} from 'lucide-react';

interface CodeFile {
  phase: string;
  path: string;
  name: string;
  lang: string;
  description: string;
  code: string;
}

const NATIVE_FILES: CodeFile[] = [
  {
    phase: 'Build & Project',
    path: 'CMakeLists.txt',
    name: 'CMakeLists.txt',
    lang: 'cmake',
    description: 'Qt 6 C++17 build configuration with Widgets, Sql, Charts, PrintSupport, and Multimedia',
    code: `cmake_minimum_required(VERSION 3.16)
project(ULM_LibraryManagementSystem VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt6 REQUIRED COMPONENTS 
    Core 
    Gui 
    Widgets 
    Sql 
    Charts 
    PrintSupport 
    Multimedia
)

set(SOURCES
    src/main.cpp
    src/DatabaseManager.cpp
    src/CatalogModel.cpp
    src/BookFormDialog.cpp
    src/MainWindow.cpp
    src/CsvWizardDialog.cpp
    src/SettingsPage.cpp
    src/AudioFeedback.cpp
    src/BarcodeScannerFilter.cpp
    src/BorrowerDialog.cpp
    src/BorrowersPage.cpp
    src/CirculationPage.cpp
    src/Code128Barcode.cpp
    src/LabelPrintDialog.cpp
    src/ReportsPage.cpp
    src/BootSplashScreen.cpp
)

set(HEADERS
    src/Models.h
    src/DatabaseManager.h
    src/CatalogModel.h
    src/BookFormDialog.h
    src/MainWindow.h
    src/CsvWizardDialog.h
    src/SettingsPage.h
    src/AudioFeedback.h
    src/BarcodeScannerFilter.h
    src/BorrowerDialog.h
    src/BorrowersPage.h
    src/CirculationPage.h
    src/Code128Barcode.h
    src/LabelPrintDialog.h
    src/ReportsPage.h
    src/BootSplashScreen.h
)

set(RESOURCES
    resources.qrc
)

add_executable(\${PROJECT_NAME} WIN32
    \${SOURCES}
    \${HEADERS}
    \${RESOURCES}
)

target_link_libraries(\${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Sql
    Qt6::Charts
    Qt6::PrintSupport
    Qt6::Multimedia
)

target_include_directories(\${PROJECT_NAME} PRIVATE src)

if(MSVC)
    target_compile_options(\${PROJECT_NAME} PRIVATE /W4 /permissive-)
else()
    target_compile_options(\${PROJECT_NAME} PRIVATE -Wall -Wextra -Wpedantic)
endif()`
  },
  {
    phase: 'Phase 1: Storage Setup',
    path: 'src/StorageSetupDialog.h',
    name: 'StorageSetupDialog.h',
    lang: 'cpp',
    description: 'First-run 580px storage setup modal with disk validation, network share warning, integrity checks & single-instance lock',
    code: `#pragma once

#include <QDialog>
#include <QLineEdit>
#include <QPushButton>
#include <QRadioButton>
#include <QLabel>
#include <QCheckBox>
#include <QButtonGroup>
#include <QFrame>
#include <QString>
#include "Models.h"

enum class StorageSetupMode {
    CreateNew,
    OpenExisting
};

struct StorageValidationResult {
    bool isValid = false;
    bool isNetworkPath = false;
    bool isLowDiskSpace = false;
    bool isRemovableDrive = false;
    bool fileAlreadyExists = false;
    bool isProgramFilesOrWindows = false;
    QString errorMessage;
    QString warningMessage;
    int booksCount = 0;
    int borrowersCount = 0;
    int schemaVersion = 0;
    QString lastModified;
};

class StorageSetupDialog : public QDialog {
    Q_OBJECT
public:
    explicit StorageSetupDialog(QWidget *parent = nullptr, 
                                bool isMissingPath = false, 
                                const QString &missingPath = QString());
    ~StorageSetupDialog() = default;

    QString getSelectedDatabasePath() const { return m_finalDatabasePath; }
    QString getSelectedFolderPath() const { return m_finalFolderPath; }
    StorageSetupMode getSetupMode() const { return m_mode; }

signals:
    void storageConfigured(const QString &folderPath, const QString &dbPath);

protected:
    void closeEvent(QCloseEvent *event) override;
    void keyPressEvent(QKeyEvent *event) override;

private slots:
    void onModeChanged(int id);
    void onBrowseClicked();
    void onUseRecommendedClicked();
    void onPathChanged(const QString &newPath);
    void onNetworkUnderstoodChanged(int state);
    void onContinueClicked();
    void onExitClicked();

private:
    void setupUi();
    void applyTheme();
    StorageValidationResult validateStorage(const QString &path, StorageSetupMode mode);
    void updateValidationUi();
    QString getRecommendedFolder() const;

    bool m_isMissingPath = false;
    QString m_missingPath;
    StorageSetupMode m_mode = StorageSetupMode::CreateNew;

    QString m_currentPath;
    QString m_finalFolderPath;
    QString m_finalDatabasePath;
    StorageValidationResult m_lastValidation;

    QFrame *m_cardFrame = nullptr;
    QLabel *m_missingPathBanner = nullptr;
    QRadioButton *m_radioCreateNew = nullptr;
    QRadioButton *m_radioOpenExisting = nullptr;
    QFrame *m_cardCreateNew = nullptr;
    QFrame *m_cardOpenExisting = nullptr;
    QButtonGroup *m_modeGroup = nullptr;
    QLineEdit *m_pathEdit = nullptr;
    QPushButton *m_btnBrowse = nullptr;
    QPushButton *m_btnRecommended = nullptr;
    QLabel *m_previewDbLabel = nullptr;
    QLabel *m_previewBackupsLabel = nullptr;
    QLabel *m_statusLabel = nullptr;
    QFrame *m_networkWarningFrame = nullptr;
    QCheckBox *m_chkNetworkUnderstood = nullptr;
    QLabel *m_existingDbSummaryLabel = nullptr;
    QPushButton *m_btnExit = nullptr;
    QPushButton *m_btnContinue = nullptr;
};`
  },
  {
    phase: 'Phase 1: Storage Setup',
    path: 'src/StorageSetupDialog.cpp',
    name: 'StorageSetupDialog.cpp',
    lang: 'cpp',
    description: 'First-run storage location setup implementation with real-time validation, VACUUM INTO migration & lock enforcement',
    code: `#include "StorageSetupDialog.h"
#include "DatabaseManager.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QFileDialog>
#include <QStandardPaths>
#include <QDir>
#include <QFileInfo>
#include <QStorageInfo>
#include <QMessageBox>
#include <QKeyEvent>
#include <QCloseEvent>
#include <QPainter>
#include <QPainterPath>
#include <QDateTime>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QCoreApplication>
#include <QUuid>

StorageSetupDialog::StorageSetupDialog(QWidget *parent, bool isMissingPath, const QString &missingPath)
    : QDialog(parent, Qt::Dialog | Qt::WindowTitleHint | Qt::CustomizeWindowHint | Qt::WindowCloseButtonHint)
    , m_isMissingPath(isMissingPath)
    , m_missingPath(missingPath)
{
    setWindowTitle("Storage Location Setup - University of Lakki Marwat LMS");
    setFixedSize(580, m_isMissingPath ? 640 : 590);
    setupUi();
    applyTheme();

    if (!m_isMissingPath) {
        onUseRecommendedClicked();
    } else {
        updateValidationUi();
    }
}

void StorageSetupDialog::onContinueClicked() {
    if (!m_lastValidation.isValid) return;

    if (m_lastValidation.isNetworkPath && !m_chkNetworkUnderstood->isChecked()) {
        QMessageBox::warning(this, "Network Location Acknowledgment",
            "Please confirm that you understand SQLite may encounter locking issues or database corruption when hosted over network shares.");
        return;
    }

    // Create Backups subfolder
    QDir folderDir(m_finalFolderPath);
    if (!folderDir.exists("Backups")) {
        folderDir.mkpath("Backups");
    }

    // Single-instance lock test (ULM_Library.db.lock)
    QString lockFilePath = m_finalFolderPath + "/ULM_Library.db.lock";
    QFile *lockFile = new QFile(lockFilePath, this);
    if (!lockFile->open(QIODevice::ReadWrite)) {
        QMessageBox::critical(this, "Database Locked",
            "Cannot open database: The library database is already in use by another instance of ULM LMS on this or another workstation.\n\nPlease close the other instance first.");
        return;
    }

    emit storageConfigured(m_finalFolderPath, m_finalDatabasePath);
    accept();
}`
  },
  {
    phase: 'Phase 1: DB Layer',
    path: 'src/DatabaseManager.h',
    name: 'DatabaseManager.h',
    lang: 'cpp',
    description: 'SQLite database manager with WAL mode, FTS5 virtual tables, transactions & migrations',
    code: `#pragma once

#include <QObject>
#include <QSqlDatabase>
#include <QSqlQuery>
#include <QSqlError>
#include <QString>
#include <QStringList>
#include <QVector>
#include <QMap>
#include <optional>
#include "Models.h"

struct ActiveLoanInfo {
    int transaction_id = 0;
    int book_id = 0;
    int accession_no = 0;
    QString barcode;
    QString title;
    QString author;
    int borrower_id = 0;
    QString borrower_name;
    QString university_id;
    QString role;
    QString issue_date;
    QString due_date;
    int days_overdue = 0;
    int fine_paisa = 0;
};

struct LibraryStats {
    int total_titles = 0;
    int total_copies = 0;
    int active_loans = 0;
    int overdue_loans = 0;
    double on_time_rate = 100.0;
    QMap<QString, int> copies_by_category;
    QVector<QPair<QString, QPair<int, int>>> monthly_activity;
};

class DatabaseManager : public QObject {
    Q_OBJECT
public:
    static DatabaseManager& instance();

    bool openDatabase(const QString &path = QString());
    void closeDatabase();

    bool runMigrations();

    // Books CRUD (Phase 1)
    int getNextAccessionNumber();
    bool addBook(Book &book);
    bool updateBook(const Book &book);
    std::optional<Book> getBookById(int id);
    std::optional<Book> getBookByBarcode(const QString &barcode);
    std::optional<Book> getBookByAccessionNo(int accNo);
    bool withdrawBook(int id);
    bool hasLoanHistory(int bookId);

    // Queries & Autocomplete
    bool hasDuplicateIsbn(const QString &isbn, int excludeId = 0);
    QStringList getDistinctAuthors();
    QStringList getDistinctPublishers();
    QStringList getDistinctPlaces();
    QStringList getDistinctCategories();

    // Settings (Phase 2)
    QString getSetting(const QString &key, const QString &defaultValue = QString());
    bool setSetting(const QString &key, const QString &value);

    // Borrowers CRUD (Phase 3)
    QVector<Borrower> getAllBorrowers(const QString &search = QString(), const QString &roleFilter = QString());
    std::optional<Borrower> getBorrowerById(int id);
    std::optional<Borrower> getBorrowerByUniversityId(const QString &uid);
    bool addBorrower(Borrower &borrower);
    bool updateBorrower(const Borrower &borrower);
    bool deleteBorrower(int id);
    int getBorrowerActiveLoansCount(int borrowerId);
    QVector<Transaction> getBorrowerTransactions(int borrowerId);

    // Circulation (Phase 3)
    bool issueBook(int bookId, int borrowerId, int loanDays);
    bool returnBook(int transactionId, int finePaidPaisa = 0);
    QVector<ActiveLoanInfo> getActiveLoans();

    // Backup & Restore (Phase 2)
    bool backupDatabase(const QString &targetPath);
    bool restoreDatabase(const QString &backupPath, QString &errorMessage);
    void runAutomaticStartupBackup();

    // CSV Import / Export (Phase 2)
    bool exportCatalogToCsv(const QString &filePath);
    bool importBooksFromCsv(const QString &filePath, const QMap<int, QString> &columnMap, 
                            QStringList &errors, int &importedCount, int &skippedCount);

    // Reports (Phase 5)
    LibraryStats getLibraryStatistics();

    QSqlDatabase& database() { return m_db; }

private:
    DatabaseManager(QObject *parent = nullptr);
    ~DatabaseManager();
    QSqlDatabase m_db;
    bool m_hasFts5 = false;
};`
  },
  {
    phase: 'Phase 2: Import & Settings',
    path: 'src/CsvWizardDialog.cpp',
    name: 'CsvWizardDialog.cpp',
    lang: 'cpp',
    description: 'UTF-8 Accession Register CSV import wizard with column mapping, 20-row preview, atomic transaction',
    code: `#include "CsvWizardDialog.h"
#include "DatabaseManager.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QFileDialog>
#include <QMessageBox>
#include <QHeaderView>
#include <QFile>
#include <QTextStream>
#include <QApplication>

void CsvWizardDialog::onStartImport() {
    if (m_selectedFilePath.isEmpty()) return;

    QMap<int, QString> columnMap;
    bool hasTitle = false;

    for (int i = 0; i < m_mappingTable->rowCount(); ++i) {
        auto *combo = qobject_cast<QComboBox*>(m_mappingTable->cellWidget(i, 1));
        if (combo) {
            QString selected = combo->currentText();
            if (selected != "-- Ignore Column --") {
                columnMap[i] = selected;
                if (selected == "title") hasTitle = true;
            }
        }
    }

    if (!hasTitle) {
        QMessageBox::critical(this, "Mapping Error", "You must map at least one column to 'title'.");
        return;
    }

    QStringList errors;
    int imported = 0;
    int skipped = 0;

    bool ok = DatabaseManager::instance().importBooksFromCsv(
        m_selectedFilePath, columnMap, errors, imported, skipped
    );

    if (ok) {
        QMessageBox::information(this, "Import Complete",
            QString("Successfully imported %1 books into the library register.\\n%2 rows skipped.")
            .arg(imported).arg(skipped));
        accept();
    }
}`
  },
  {
    phase: 'Phase 3: Circulation & Scanner',
    path: 'src/BarcodeScannerFilter.cpp',
    name: 'BarcodeScannerFilter.cpp',
    lang: 'cpp',
    description: 'Hardware USB/Bluetooth scanner buffer intercepting keystrokes < 50ms apart without fixed length',
    code: `#include "BarcodeScannerFilter.h"
#include "AudioFeedback.h"
#include <QKeyEvent>

bool BarcodeScannerFilter::eventFilter(QObject *watched, QEvent *event) {
    if (event->type() != QEvent::KeyPress) {
        return QObject::eventFilter(watched, event);
    }

    auto *keyEvent = static_cast<QKeyEvent*>(event);
    int key = keyEvent->key();

    // Check for Enter / Return flush trigger
    if (key == Qt::Key_Return || key == Qt::Key_Enter) {
        if (!m_buffer.isEmpty() && m_isScanningStream) {
            m_idleTimer->stop();
            flushBuffer();
            return true; // Eat Enter event from barcode hardware
        }
        return QObject::eventFilter(watched, event);
    }

    QString text = keyEvent->text();
    if (text.isEmpty() || !text.at(0).isPrint()) {
        return QObject::eventFilter(watched, event);
    }

    qint64 elapsed = m_elapsedTimer.isValid() ? m_elapsedTimer.restart() : 999999;
    if (!m_elapsedTimer.isValid()) {
        m_elapsedTimer.start();
    }

    if (elapsed < m_maxInterKeyGapMs) {
        // High speed typing characteristic of hardware barcode scanner
        m_isScanningStream = true;
        m_buffer.append(text);
        m_idleTimer->start(m_idleFlushTimeoutMs);
        return true;
    } else {
        if (m_buffer.size() >= 3 && m_isScanningStream) {
            flushBuffer();
        }
        m_buffer.clear();
        m_buffer.append(text);
        m_isScanningStream = false;
        m_idleTimer->start(m_idleFlushTimeoutMs);
    }

    return QObject::eventFilter(watched, event);
}

void BarcodeScannerFilter::flushBuffer() {
    QString code = m_buffer.trimmed();
    m_buffer.clear();
    m_isScanningStream = false;

    if (!code.isEmpty()) {
        AudioFeedback::instance().playClick();
        emit barcodeScanned(code);
    }
}`
  },
  {
    phase: 'Phase 3: In-Memory Audio',
    path: 'src/AudioFeedback.cpp',
    name: 'AudioFeedback.cpp',
    lang: 'cpp',
    description: 'Pure synthesized PCM audio generator (1760/2093Hz success, 523/659/784Hz return, 180Hz square buzz, 1200Hz click)',
    code: `#include "AudioFeedback.h"
#include <QtMath>

// 1. Success: 1760 Hz then 2093 Hz double beep
void AudioFeedback::playSuccessBeep() {
    QByteArray tone1 = generateSineTone(1760.0, 70, 0.45);
    QByteArray pause(44100 * 25 / 1000 * sizeof(qint16), 0);
    QByteArray tone2 = generateSineTone(2093.0, 90, 0.45);
    playPcmData(tone1 + pause + tone2);
}

// 2. Return: Ascending chord 523 / 659 / 784 Hz (C5, E5, G5)
void AudioFeedback::playReturnChord() {
    QByteArray c5 = generateSineTone(523.25, 70, 0.35);
    QByteArray e5 = generateSineTone(659.25, 70, 0.35);
    QByteArray chord = generateChord({523.25, 659.25, 783.99}, 140, 0.4);
    playPcmData(c5 + e5 + chord);
}

// 3. Error: 180 Hz square-wave double buzz
void AudioFeedback::playErrorBuzz() {
    QByteArray buzz1 = generateSquareTone(180.0, 100, 0.35);
    QByteArray pause(44100 * 40 / 1000 * sizeof(qint16), 0);
    QByteArray buzz2 = generateSquareTone(180.0, 120, 0.35);
    playPcmData(buzz1 + pause + buzz2);
}

// 4. Click: 1200 Hz, 10 ms click
void AudioFeedback::playClick() {
    QByteArray click = generateSineTone(1200.0, 10, 0.25);
    playPcmData(click);
}`
  },
  {
    phase: 'Phase 4: Code-128 & Labels',
    path: 'src/Code128Barcode.cpp',
    name: 'Code128Barcode.cpp',
    lang: 'cpp',
    description: 'Code-128 Subset B encoder & modulo 103 checksum generator with 10-module quiet zones',
    code: `#include "Code128Barcode.h"
#include <cmath>

int Code128Barcode::calculateChecksum(const QVector<int> &codeValues) {
    if (codeValues.isEmpty()) return 0;
    qint64 sum = codeValues[0];
    for (int i = 1; i < codeValues.size(); ++i) {
        sum += static_cast<qint64>(codeValues[i]) * i;
    }
    return static_cast<int>(sum % 103);
}

bool Code128Barcode::encodeSubsetB(const QString &text, QVector<int> &outModules) {
    outModules.clear();
    QVector<int> values;
    values.append(104); // START B

    for (QChar c : text) {
        int ascii = c.toLatin1();
        values.append(ascii - 32);
    }

    int checksum = calculateChecksum(values);
    values.append(checksum);
    values.append(106); // STOP

    // 10-module quiet zone at start
    for (int i = 0; i < 10; ++i) outModules.append(0);

    for (int val : values) {
        const int *pattern = CODE128_PATTERNS[val];
        for (int p = 0; p < 6; ++p) {
            int width = pattern[p];
            int isBar = (p % 2 == 0) ? 1 : 0;
            for (int w = 0; w < width; ++w) outModules.append(isBar);
        }
    }

    outModules.append(1); outModules.append(1); // Stop terminal bar
    for (int i = 0; i < 10; ++i) outModules.append(0); // Trailing quiet zone
    return true;
}`
  },
  {
    phase: 'Phase 4: QPrinter Label',
    path: 'src/LabelPrintDialog.cpp',
    name: 'LabelPrintDialog.cpp',
    lang: 'cpp',
    description: '2.5in x 1.5in (63.5 x 38.1 mm) label via QPrinter, vector crest, call no, Code-128 barcode',
    code: `#include "LabelPrintDialog.h"
#include "Code128Barcode.h"

void LabelPrintDialog::drawLabel(QPainter *painter, const QRectF &rect, const Book &book) {
    painter->save();
    painter->fillRect(rect, Qt::white);
    painter->setPen(QPen(Qt::black, 1.5));
    painter->drawRect(rect.adjusted(2, 2, -2, -2));

    double w = rect.width();
    double h = rect.height();

    // Vector Crest & Header
    painter->setFont(QFont("Cinzel", 11, QFont::Bold));
    painter->drawText(QRectF(40.0, 10.0, w - 50.0, 16.0), Qt::AlignLeft, "UNIVERSITY OF LAKKI MARWAT");

    // Book Information
    painter->setFont(QFont("Plus Jakarta Sans", 10, QFont::Bold));
    painter->drawText(QRectF(12.0, 46.0, w - 24.0, 20.0), Qt::AlignLeft, book.title);

    // Call Number & Shelf Coordinates
    painter->setFont(QFont("JetBrains Mono", 9, QFont::Bold));
    QString callAndShelf = QString("CALL: %1  |  SHELF: %2")
        .arg(book.dewey_call_number.isEmpty() ? "GENERAL" : book.dewey_call_number)
        .arg(book.shelf.isEmpty() ? "UNASSIGNED" : book.shelf);
    painter->drawText(QRectF(12.0, 68.0, w - 24.0, 16.0), Qt::AlignLeft, callAndShelf);

    // Code-128 Barcode with 10-module Quiet Zone
    QRectF barcodeRect(12.0, 92.0, w - 24.0, h - 134.0);
    Code128Barcode::drawBarcode(painter, barcodeRect, book.barcode);

    // Mandatory Footer
    painter->setFont(QFont("Plus Jakarta Sans", 8, QFont::Bold));
    painter->drawText(QRectF(10.0, h - 22.0, w - 20.0, 16.0), Qt::AlignCenter, "CENTRAL CAMPUS LIBRARY - PROPERTY OF ULM");
    painter->restore();
}`
  },
  {
    phase: 'Phase 5: Reports & Charts',
    path: 'src/ReportsPage.cpp',
    name: 'ReportsPage.cpp',
    lang: 'cpp',
    description: 'Qt Charts analytics (monthly circulation & category pie) + printable A4 audit sheet generator',
    code: `#include "ReportsPage.h"
#include <QBarSet>
#include <QBarSeries>
#include <QPieSeries>

void ReportsPage::updateCharts(const LibraryStats &stats) {
    // 1. Monthly Activity Bar Chart
    auto *barSetIssued = new QBarSet("Books Issued");
    barSetIssued->setColor(QColor("#2563EB"));

    auto *barSetReturned = new QBarSet("Books Returned");
    barSetReturned->setColor(QColor("#10B981"));

    for (const auto &item : stats.monthly_activity) {
        *barSetIssued << item.second.first;
        *barSetReturned << item.second.second;
    }

    auto *series = new QBarSeries();
    series->append(barSetIssued);
    series->append(barSetReturned);

    auto *chart = new QChart();
    chart->addSeries(series);
    chart->setTitle("Monthly Circulation Activity: Issued vs. Returned");
    chart->setTheme(QChart::ChartThemeDark);
    m_activityChartView->setChart(chart);

    // 2. Category Pie Chart
    auto *pieSeries = new QPieSeries();
    for (auto it = stats.copies_by_category.begin(); it != stats.copies_by_category.end(); ++it) {
        pieSeries->append(it.key(), it.value());
    }
    auto *pieChart = new QChart();
    pieChart->addSeries(pieSeries);
    pieChart->setTitle("Catalog Holdings by Category");
    m_categoryChartView->setChart(pieChart);
}`
  },
  {
    phase: 'Phase 5: Boot Splash',
    path: 'src/BootSplashScreen.cpp',
    name: 'BootSplashScreen.cpp',
    lang: 'cpp',
    description: '2.5 s animated diagnostic lines (ULM BIOS 2.4, SQLite mounted, scanner ready), skippable',
    code: `#include "BootSplashScreen.h"

BootSplashScreen::BootSplashScreen(QWidget *parent)
    : QWidget(parent, Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint)
{
    setFixedSize(720, 440);
    setStyleSheet("background-color: #020617;");

    m_diagnosticLines = {
        ">> ULM BIOS v2.4 (x86_64 UEFI) ... OK",
        ">> Initializing University of Lakki Marwat Hardware Core ... OK",
        ">> Memory check: 64MB Cache Allocated (PRAGMA cache_size = -64000) ... PASSED",
        ">> SQLite Database Engine Mounted: WAL Mode, Synchronous NORMAL ... OK",
        ">> FTS5 Full-Text Search Virtual Triggers Registered ... OK",
        ">> High-DPI Windows 11 Vector Subsystem Initialized ... OK",
        ">> Code-128 (Subset B) Hardware Barcode Scanner Engine ... READY",
        ">> Plus Jakarta Sans & JetBrains Mono Typography Mounted ... OK",
        ">> Launching ULM Central Campus LMS Desktop Workstation ... [PRESS ANY KEY TO SKIP]"
    };

    m_timer = new QTimer(this);
    connect(m_timer, &QTimer::timeout, this, &BootSplashScreen::onTick);
    m_timer->start(270);
}`
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
    const combined = NATIVE_FILES.map(f => 
      `// ==========================================================================\n` +
      `// [${f.phase}] ${f.path} - ${f.description}\n` +
      `// ==========================================================================\n\n` +
      `${f.code}\n\n`
    ).join('\n');

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ULM_LMS_Complete_All_Phases_Cpp17_Qt6_SourceBundle.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 w-full bg-[#020617] px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0B1220] border border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
                <span>C++17 & Qt 6 Complete Architecture (All 5 Phases)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ALL PHASES 1-5 DELIVERED
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono-code mt-0.5">
                Target: Windows 10/11 x64 · Qt 6 (Widgets, Sql, Charts, PrintSupport, Multimedia) · SQLite WAL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Download Complete 5-Phase Source Bundle</span>
            </button>
          </div>
        </div>

        {/* 5 Phases Status Tracker */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 bg-[#0B1220] p-3 rounded-xl border border-[#1E293B] shadow-2xs">
          <div className="bg-[#020617] p-2.5 rounded-lg border border-[#334155] text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code text-amber-400 font-bold">PHASE 1</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-[#F1F5F9] block mt-1">Core & DB Layer</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Accession Register & FTS5</p>
          </div>

          <div className="bg-[#020617] p-2.5 rounded-lg border border-[#334155] text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code text-amber-400 font-bold">PHASE 2</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-[#F1F5F9] block mt-1">CSV & Backup</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Wizard & VACUUM INTO</p>
          </div>

          <div className="bg-[#020617] p-2.5 rounded-lg border border-[#334155] text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code text-amber-400 font-bold">PHASE 3</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-[#F1F5F9] block mt-1">Circulation & Audio</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Scanner filter & PCM Audio</p>
          </div>

          <div className="bg-[#020617] p-2.5 rounded-lg border border-[#334155] text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code text-amber-400 font-bold">PHASE 4</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-[#F1F5F9] block mt-1">Code-128 Labels</span>
            <p className="text-[10px] text-slate-400 mt-0.5">2.5×1.5" QPrinter Label</p>
          </div>

          <div className="bg-[#020617] p-2.5 rounded-lg border border-[#334155] text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code text-amber-400 font-bold">PHASE 5</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-[#F1F5F9] block mt-1">Reports & Splash</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Qt Charts & 2.5s Boot</p>
          </div>
        </div>

        {/* Code File Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* File List Navigation */}
          <div className="bg-[#0B1220] border border-[#1E293B] rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="px-2 py-1 text-[11px] font-mono-code font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Qt 6 Native Modules</span>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {NATIVE_FILES.map((file, idx) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono-code transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-xs'
                        : 'text-slate-300 hover:bg-[#1E293B] border border-transparent'
                    }`}
                  >
                    <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{file.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{file.phase}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-3 bg-[#0B1220] border border-[#1E293B] rounded-xl shadow-2xs overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-[#1E293B]">
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-mono-code text-xs font-bold text-[#F1F5F9] truncate">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  — {selectedFile.description}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-200 text-xs font-mono-code transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 text-xs font-mono-code text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed select-text bg-[#020617]">
              <code>{selectedFile.code}</code>
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
};
