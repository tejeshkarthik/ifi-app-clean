// Export helper functions for full data exports
// Provides utilities for formatting, flattening arrays, and safe value access

/**
 * Flatten an array of objects to a comma-separated string of a specific field
 */
export function flattenArray<T>(arr: T[] | undefined | null, field: keyof T): string {
    if (!arr || !arr.length) return '';
    return arr
        .map(item => item[field])
        .filter(Boolean)
        .join(', ');
}

/**
 * Flatten an array of objects with multiple fields
 * e.g., flattenArrayMulti(pocs, ['name', 'phone']) => "John (555-1234), Jane (555-5678)"
 */
export function flattenArrayMulti<T>(
    arr: T[] | undefined | null,
    nameField: keyof T,
    detailField?: keyof T
): string {
    if (!arr || !arr.length) return '';
    return arr
        .map(item => {
            const name = item[nameField];
            const detail = detailField ? item[detailField] : null;
            if (detail) {
                return `${name} (${detail})`;
            }
            return String(name || '');
        })
        .filter(Boolean)
        .join(', ');
}

/**
 * Format date for export (MM/DD/YYYY)
 */
export function formatExportDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    });
}

/**
 * Format datetime for export (MM/DD/YYYY HH:MM AM/PM)
 */
export function formatExportDateTime(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/**
 * Format boolean for export ("Yes" / "No")
 */
export function formatBoolean(val: boolean | null | undefined): string {
    if (val === null || val === undefined) return '';
    return val ? 'Yes' : 'No';
}

/**
 * Safe value accessor - returns empty string for null/undefined
 */
export function safeValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'boolean') return formatBoolean(val);
    if (typeof val === 'number') return String(val);
    return String(val);
}

/**
 * Format currency for export ($#,##0.00)
 */
export function formatCurrency(val: number | null | undefined): string {
    if (val === null || val === undefined) return '';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(val);
}

/**
 * Format number with commas and optional decimals
 */
export function formatNumber(val: number | null | undefined, decimals: number = 0): string {
    if (val === null || val === undefined) return '';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(val);
}

/**
 * Sum array field values
 */
export function sumArrayField<T>(arr: T[] | undefined | null, field: keyof T): number {
    if (!arr || !arr.length) return 0;
    return arr.reduce((sum, item) => {
        const val = item[field];
        return sum + (typeof val === 'number' ? val : 0);
    }, 0);
}

/**
 * Count array length safely
 */
export function countArray(arr: unknown[] | undefined | null): number {
    return arr?.length || 0;
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(moduleName: string, extension: string = 'xlsx'): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    return `${moduleName}_Export_${dateStr}_${timeStr}.${extension}`;
}

/**
 * Transform a record using column mapping
 * Takes raw data and applies column transformations
 */
export function transformRecordForExport<T extends Record<string, unknown>>(
    record: T,
    columnMappings: ExportColumnMapping[]
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const mapping of columnMappings) {
        try {
            result[mapping.header] = mapping.accessor(record);
        } catch {
            result[mapping.header] = '';
        }
    }

    return result;
}

/**
 * Export column mapping definition
 */
export interface ExportColumnMapping {
    header: string;
    accessor: (record: Record<string, unknown>) => unknown;
    width?: number; // Column width hint
}

/**
 * Batch transform records for export
 */
export function transformRecordsForExport<T extends Record<string, unknown>>(
    records: T[],
    columnMappings: ExportColumnMapping[]
): Record<string, unknown>[] {
    return records.map(record => transformRecordForExport(record, columnMappings));
}

/**
 * Nested object accessor helper
 * e.g., getNestedValue(obj, 'location.city') => obj.location?.city
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let result: unknown = obj;

    for (const key of keys) {
        if (result === null || result === undefined) return '';
        if (typeof result !== 'object') return '';
        result = (result as Record<string, unknown>)[key];
    }

    return result ?? '';
}
