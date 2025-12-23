// Export utilities for Excel and PDF generation
// Uses browser APIs without external dependencies

export interface ExportColumn {
    key: string;
    header: string;
    width?: number;
}

// ==================== EXCEL EXPORT ====================

export function exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn[],
    filename: string
): void {
    // Create CSV content (Excel compatible)
    const headers = columns.map(c => c.header).join(',');
    const rows = data.map(row =>
        columns.map(col => {
            const value = row[col.key];
            // Handle special characters and commas
            if (value === null || value === undefined) return '';
            const strValue = String(value);
            if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
        }).join(',')
    ).join('\n');

    const csvContent = `\uFEFF${headers}\n${rows}`; // BOM for Excel UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
}

// ==================== PDF EXPORT ====================

export function exportToPDF<T extends Record<string, unknown>>(
    data: T[],
    columns: ExportColumn[],
    title: string,
    filename: string,
    companyName: string = 'Industrial Fabrics Inc.'
): void {
    // Create printable HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            font-size: 10px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
        }
        .report-title {
            font-size: 14px;
            color: #666;
        }
        .print-date {
            font-size: 10px;
            color: #999;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
        }
        th { 
            background: #1e40af; 
            color: white; 
            padding: 8px 4px;
            text-align: left;
            font-size: 9px;
        }
        td { 
            border: 1px solid #ddd; 
            padding: 6px 4px;
            font-size: 9px;
        }
        tr:nth-child(even) { background: #f9fafb; }
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 8px;
            color: #999;
            text-align: center;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">${companyName}</div>
            <div class="report-title">${title}</div>
        </div>
        <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
    </div>
    <table>
        <thead>
            <tr>
                ${columns.map(col => `<th>${col.header}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map(row => `
                <tr>
                    ${columns.map(col => {
        const value = row[col.key];
        return `<td>${value ?? ''}</td>`;
    }).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="footer">
        ${companyName} • Confidential • Page 1
    </div>
    <script>
        window.onload = function() { window.print(); }
    </script>
</body>
</html>`;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}

// ==================== SINGLE FORM PDF ====================

export function exportFormToPDF(
    formHtml: string,
    title: string,
    companyName: string = 'Industrial Fabrics Inc.'
): void {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            font-size: 11px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1e40af;
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
        }
        .print-date {
            font-size: 10px;
            color: #999;
        }
        .form-content {
            margin-top: 20px;
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px;
            text-align: left;
        }
        th { 
            background: #f3f4f6;
            font-weight: 600;
        }
        .signature-box {
            border: 1px solid #ddd;
            padding: 10px;
            margin-top: 10px;
            min-height: 80px;
        }
        .signature-label {
            font-size: 10px;
            color: #666;
            border-top: 1px solid #333;
            padding-top: 5px;
            margin-top: 50px;
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="print-date">Printed: ${new Date().toLocaleString()}</div>
    </div>
    <div class="form-content">
        ${formHtml}
    </div>
    <script>
        window.onload = function() { window.print(); }
    </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
}

// ==================== HELPERS ====================

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==================== EXPORT CONFIGS ====================
// Full data export columns for all modules

export const DAILY_REPORT_COLUMNS: ExportColumn[] = [
    // Basic Info
    { key: 'id', header: 'Report ID' },
    { key: 'date', header: 'Date' },
    { key: 'projectName', header: 'Project' },
    { key: 'epNumber', header: 'EP #' },
    { key: 'status', header: 'Status' },

    // Oil Info
    { key: 'oilTypeName', header: 'Oil Type' },
    { key: 'oilSuppliedByName', header: 'Oil Supplied By' },
    { key: 'asphaltMixTypeName', header: 'Asphalt Mix Type' },
    { key: 'oilGradeName', header: 'Oil Grade' },
    { key: 'highGradeName', header: 'High Grade' },

    // Station Totals
    { key: 'stationCount', header: 'Station Count' },
    { key: 'totalSy', header: 'Total Station SY' },

    // Material Totals
    { key: 'materialCount', header: 'Material Count' },
    { key: 'totalNetSy', header: 'Total Net SY' },

    // Tack Coat
    { key: 'tackCoatTypeName', header: 'Tack Coat Type' },
    { key: 'tackStartGallons', header: 'Tack Start Gallons' },
    { key: 'tackEndGallons', header: 'Tack End Gallons' },
    { key: 'tackTotalGallons', header: 'Tack Total Used' },
    { key: 'applicationRate', header: 'Application Rate (gal/SY)' },
    { key: 'gridBeneath', header: 'Grid Beneath' },
    { key: 'gridOnTop', header: 'Grid On Top' },

    // Standby
    { key: 'standbyCustomer', header: 'Standby - Customer' },
    { key: 'standbyDemobilization', header: 'Standby - Demob' },
    { key: 'standbyWeather', header: 'Standby - Weather' },
    { key: 'standbyDuration', header: 'Standby Duration' },
    { key: 'comments', header: 'Additional Notes' },

    // Signatures
    { key: 'supervisorName', header: 'IFI Supervisor' },
    { key: 'supervisorSigned', header: 'Supervisor Signed' },
    { key: 'contractorPocName', header: 'Contractor Rep' },
    { key: 'contractorSigned', header: 'Contractor Signed' },

    // Meta
    { key: 'createdBy', header: 'Created By' },
    { key: 'createdAt', header: 'Created Date' },
];

export const TIMESHEET_COLUMNS: ExportColumn[] = [
    { key: 'id', header: 'Timesheet ID' },
    { key: 'date', header: 'Date' },
    { key: 'projectName', header: 'Project' },
    { key: 'epNumber', header: 'EP #' },
    { key: 'shiftName', header: 'Shift' },
    { key: 'status', header: 'Status' },
    { key: 'employeeCount', header: 'Total Employees' },
    { key: 'employeeNames', header: 'Employee Names' },
    { key: 'totalRegularHours', header: 'Total Regular Hours' },
    { key: 'totalOvertimeHours', header: 'Total Overtime Hours' },
    { key: 'totalHours', header: 'Total Hours' },
    { key: 'notes', header: 'Notes' },
    { key: 'createdBy', header: 'Created By' },
    { key: 'createdAt', header: 'Created Date' },
    { key: 'approvedBy', header: 'Approved By' },
    { key: 'approvedAt', header: 'Approved Date' },
];

export const ISSUES_LOG_COLUMNS: ExportColumn[] = [
    { key: 'id', header: 'Issue ID' },
    { key: 'date', header: 'Date' },
    { key: 'time', header: 'Time' },
    { key: 'projectName', header: 'Project' },
    { key: 'epNumber', header: 'EP #' },
    { key: 'issueTypeName', header: 'Issue Type' },
    { key: 'flag', header: 'Priority' },
    { key: 'description', header: 'Description' },
    { key: 'temperature', header: 'Temperature (°F)' },
    { key: 'rain', header: 'Rain' },
    { key: 'rainDuration', header: 'Rain Duration' },
    { key: 'plantBreakdown', header: 'Plant Breakdown' },
    { key: 'breakdownDuration', header: 'Breakdown Duration' },
    { key: 'photoCount', header: 'Photos Count' },
    { key: 'notes', header: 'Notes' },
    { key: 'status', header: 'Status' },
    { key: 'reportedByName', header: 'Reported By' },
    { key: 'createdAt', header: 'Created Date' },
];

export const JHA_COLUMNS: ExportColumn[] = [
    { key: 'id', header: 'JHA ID' },
    { key: 'formNumber', header: 'Form Number' },
    { key: 'date', header: 'Date' },
    { key: 'time', header: 'Time' },
    { key: 'shift', header: 'Shift' },
    { key: 'projectName', header: 'Project' },
    { key: 'epNumber', header: 'EP #' },
    { key: 'location', header: 'Location' },
    { key: 'jobDescription', header: 'Job Description' },
    { key: 'completedByName', header: 'Completed By' },
    { key: 'taskCount', header: 'Task Count' },
    { key: 'tasks', header: 'Tasks' },
    { key: 'hazards', header: 'Hazards' },
    { key: 'crewCount', header: 'Crew Count' },
    { key: 'crewNames', header: 'Crew Names' },
    { key: 'notes', header: 'Additional Notes' },
    { key: 'signaturePresent', header: 'Signature Present' },
    { key: 'status', header: 'Status' },
    { key: 'createdBy', header: 'Created By' },
    { key: 'createdAt', header: 'Created Date' },
];

export const PRECONSTRUCTION_COLUMNS: ExportColumn[] = [
    { key: 'id', header: 'Checklist ID' },
    { key: 'date', header: 'Date' },
    { key: 'projectName', header: 'Project' },
    { key: 'epNumber', header: 'EP #' },
    { key: 'status', header: 'Status' },
    { key: 'completedBy', header: 'Completed By' },
    { key: 'totalItems', header: 'Total Items' },
    { key: 'completedItems', header: 'Completed Items' },
    { key: 'completionPercent', header: 'Completion %' },
    { key: 'notes', header: 'Notes' },
    { key: 'signaturePresent', header: 'Signature Present' },
    { key: 'createdBy', header: 'Created By' },
    { key: 'createdAt', header: 'Created Date' },
];

export const BOL_COLUMNS: ExportColumn[] = [
    { key: 'id', header: 'BOL ID' },
    { key: 'bolNumber', header: 'BOL Number' },
    { key: 'date', header: 'Date' },
    { key: 'projectName', header: 'Project' },
    { key: 'epNumber', header: 'EP #' },
    { key: 'status', header: 'Status' },
    { key: 'shipperName', header: 'Shipper' },
    { key: 'shipFrom', header: 'Ship From' },
    { key: 'shipTo', header: 'Ship To' },
    { key: 'carrierName', header: 'Carrier' },
    { key: 'truckNumber', header: 'Truck Number' },
    { key: 'trailerNumber', header: 'Trailer Number' },
    { key: 'materialCount', header: 'Material Count' },
    { key: 'materials', header: 'Materials' },
    { key: 'totalRolls', header: 'Total Rolls' },
    { key: 'shipDate', header: 'Ship Date' },
    { key: 'deliveryDate', header: 'Delivery Date' },
    { key: 'receivedDate', header: 'Received Date' },
    { key: 'notes', header: 'Notes' },
    { key: 'signaturePresent', header: 'Signature Present' },
    { key: 'createdBy', header: 'Created By' },
    { key: 'createdAt', header: 'Created Date' },
];

