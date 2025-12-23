'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export interface ColumnConfig {
    key: string;
    header: string;
    required?: boolean;
}

interface ExcelImportProps {
    columns: ColumnConfig[];
    onImport: (data: Record<string, string>[]) => { success: number; errors: number };
    templateFilename?: string;
}

export function ExcelImport({ columns, onImport, templateFilename = 'template' }: ExcelImportProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMessage('');
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { header: 'A' });

                if (jsonData.length < 2) {
                    setErrorMessage('File appears to be empty or has no data rows');
                    return;
                }

                // First row is headers
                const headerRow = jsonData[0];
                const headers = Object.values(headerRow);

                // Map columns based on header names
                const columnMapping: Record<string, string> = {};
                columns.forEach(col => {
                    const headerIndex = headers.findIndex(h =>
                        h.toLowerCase().trim() === col.header.toLowerCase().trim()
                    );
                    if (headerIndex !== -1) {
                        columnMapping[Object.keys(headerRow)[headerIndex]] = col.key;
                    }
                });

                // Check required columns
                const missingColumns = columns
                    .filter(c => c.required)
                    .filter(c => !Object.values(columnMapping).includes(c.key));

                if (missingColumns.length > 0) {
                    setErrorMessage(`Missing required columns: ${missingColumns.map(c => c.header).join(', ')}`);
                    return;
                }

                // Parse data rows
                const parsedData = jsonData.slice(1).map(row => {
                    const parsed: Record<string, string> = {};
                    Object.entries(row).forEach(([cellKey, cellValue]) => {
                        const mappedKey = columnMapping[cellKey];
                        if (mappedKey) {
                            parsed[mappedKey] = String(cellValue || '').trim();
                        }
                    });
                    return parsed;
                }).filter(row => Object.values(row).some(v => v));

                setPreviewData(parsedData);
                setIsModalOpen(true);
            } catch {
                setErrorMessage('Failed to parse file. Make sure it is a valid Excel or CSV file.');
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImport = () => {
        const result = onImport(previewData);
        setImportResult(result);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setPreviewData([]);
        setImportResult(null);
        setErrorMessage('');
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([columns.map(c => c.header)]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `${templateFilename}.xlsx`);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadTemplate} title="Download template">
                    <Download className="h-4 w-4" />
                </Button>
            </div>

            {errorMessage && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {errorMessage}
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Import Preview
                        </DialogTitle>
                        <DialogDescription>
                            Review the data before importing. Showing first {Math.min(10, previewData.length)} of {previewData.length} rows.
                        </DialogDescription>
                    </DialogHeader>

                    {importResult ? (
                        <div className="py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Import Complete</h3>
                            <div className="flex items-center justify-center gap-4">
                                <Badge className="bg-green-100 text-green-700">
                                    {importResult.success} imported
                                </Badge>
                                {importResult.errors > 0 && (
                                    <Badge className="bg-red-100 text-red-700">
                                        {importResult.errors} errors
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="w-12">#</TableHead>
                                        {columns.map(col => (
                                            <TableHead key={col.key}>
                                                {col.header}
                                                {col.required && <span className="text-red-500">*</span>}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 10).map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-slate-500">{index + 1}</TableCell>
                                            {columns.map(col => (
                                                <TableCell key={col.key}>
                                                    {row[col.key] || <span className="text-slate-400">-</span>}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            {importResult ? 'Close' : 'Cancel'}
                        </Button>
                        {!importResult && (
                            <Button onClick={handleImport}>
                                <Upload className="h-4 w-4 mr-2" />
                                Import {previewData.length} Records
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
