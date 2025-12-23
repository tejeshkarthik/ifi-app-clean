// Export column definitions for all modules
// Each module has a complete list of columns for full data export

import {
    ExportColumnMapping,
    flattenArray,
    formatExportDate,
    formatExportDateTime,
    formatBoolean,
    safeValue,
    formatNumber,
    sumArrayField,
    countArray,
    getNestedValue,
} from './export-helpers';

// ==================== PROJECTS EXPORT (~65 columns) ====================

export const PROJECT_EXPORT_COLUMNS: ExportColumnMapping[] = [
    // Basic Info
    { header: 'Project ID', accessor: (r) => safeValue(r.id) },
    { header: 'Project Name', accessor: (r) => safeValue(r.name) },
    { header: 'EP Number', accessor: (r) => safeValue(r.epNumber) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Contract Status', accessor: (r) => safeValue(r.contractStatus) },
    { header: 'Salesperson', accessor: (r) => safeValue(getNestedValue(r, 'salesperson.name') || r.salesperson) },
    { header: 'Created Date', accessor: (r) => formatExportDate(r.createdAt as string) },
    { header: 'Last Updated', accessor: (r) => formatExportDate(r.updatedAt as string) },

    // Location
    { header: 'Street Address', accessor: (r) => safeValue(r.address) },
    { header: 'City', accessor: (r) => safeValue(r.city) },
    { header: 'County', accessor: (r) => safeValue(r.county) },
    { header: 'State', accessor: (r) => safeValue(r.state) },
    { header: 'Zip Code', accessor: (r) => safeValue(r.zip) },
    { header: 'GPS Start', accessor: (r) => safeValue(r.gpsStart) },
    { header: 'GPS End', accessor: (r) => safeValue(r.gpsEnd) },

    // Owner
    { header: 'Owner Name', accessor: (r) => safeValue(r.ownerName) },
    { header: 'Owner POC Names', accessor: (r) => flattenArray(r.ownerPocs as any[], 'name') },
    { header: 'Owner POC Phones', accessor: (r) => flattenArray(r.ownerPocs as any[], 'phone') },
    { header: 'Owner POC Emails', accessor: (r) => flattenArray(r.ownerPocs as any[], 'email') },

    // Contractor
    { header: 'Contractor Name', accessor: (r) => safeValue(r.contractorName) },
    { header: 'Contractor POC Names', accessor: (r) => flattenArray(r.contractorPocs as any[], 'name') },
    { header: 'Contractor POC Phones', accessor: (r) => flattenArray(r.contractorPocs as any[], 'phone') },
    { header: 'Contractor POC Emails', accessor: (r) => flattenArray(r.contractorPocs as any[], 'email') },

    // Inspector
    { header: 'Inspector Company', accessor: (r) => safeValue(r.inspectorName) },
    { header: 'Inspector POC Names', accessor: (r) => flattenArray(r.inspectorPocs as any[], 'name') },
    { header: 'Inspector POC Phones', accessor: (r) => flattenArray(r.inspectorPocs as any[], 'phone') },
    { header: 'Inspector POC Emails', accessor: (r) => flattenArray(r.inspectorPocs as any[], 'email') },

    // IFI Team
    { header: 'Project Manager(s)', accessor: (r) => flattenArray(r.personnel as any[], 'name') },
    { header: 'PM Emails', accessor: (r) => flattenArray(r.personnel as any[], 'email') },
    { header: 'Total Crew Count', accessor: (r) => countArray(r.personnel as any[]) },

    // Schedule
    { header: 'Estimated Start Date', accessor: (r) => formatExportDate(r.estimatedStartDate as string) },
    { header: 'Estimated End Date', accessor: (r) => formatExportDate(r.estimatedEndDate as string) },
    { header: 'Actual Start Date', accessor: (r) => formatExportDate(r.actualStartDate as string) },
    { header: 'Actual End Date', accessor: (r) => formatExportDate(r.actualEndDate as string) },
    { header: 'Shift', accessor: (r) => safeValue(r.shift) },

    // Materials
    {
        header: 'Materials', accessor: (r) => {
            const mats = r.materials as any[];
            if (!mats || !mats.length) return '';
            return mats.map(m => `${m.materialCode || m.materialName}: ${m.estimatedQty || 0} SY`).join('; ');
        }
    },
    { header: 'Total Estimated SY', accessor: (r) => sumArrayField(r.materials as any[], 'estimatedQty') },
    { header: 'Total Estimated Rolls', accessor: (r) => sumArrayField(r.materials as any[], 'estimatedRolls') },

    // Oil & Tack
    { header: 'Oil Type', accessor: (r) => safeValue(r.oilTypeName || r.oilType) },
    { header: 'Oil Grade', accessor: (r) => safeValue(r.oilGradeName || r.oilGrade) },
    { header: 'Tack Coat Type', accessor: (r) => safeValue(r.tackCoatTypeName || r.tackCoatType) },
    { header: 'High Grade', accessor: (r) => safeValue(r.highGradeName || r.highGrade) },

    // Equipment
    { header: 'Equipment', accessor: (r) => flattenArray(r.equipment as any[], 'name') },

    // Notes
    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
];

// ==================== TIMESHEET EXPORT ====================

export const TIMESHEET_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'Timesheet ID', accessor: (r) => safeValue(r.id) },
    { header: 'Date', accessor: (r) => formatExportDate(r.date as string) },
    { header: 'Project Name', accessor: (r) => safeValue(r.projectName) },
    { header: 'EP Number', accessor: (r) => safeValue(r.epNumber) },
    { header: 'Shift', accessor: (r) => safeValue(r.shift) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Total Employees', accessor: (r) => countArray(r.employees as any[]) },
    { header: 'Employee Names', accessor: (r) => flattenArray(r.employees as any[], 'employeeName') },
    { header: 'Total Regular Hours', accessor: (r) => sumArrayField(r.employees as any[], 'regularHours') },
    { header: 'Total Overtime Hours', accessor: (r) => sumArrayField(r.employees as any[], 'overtimeHours') },
    {
        header: 'Total Hours', accessor: (r) => {
            const emps = r.employees as any[];
            if (!emps) return 0;
            return emps.reduce((sum, e) => sum + (e.regularHours || 0) + (e.overtimeHours || 0), 0);
        }
    },
    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
    { header: 'Created By', accessor: (r) => safeValue(r.createdBy) },
    { header: 'Created Date', accessor: (r) => formatExportDateTime(r.createdAt as string) },
    { header: 'Approved By', accessor: (r) => safeValue(r.approvedBy) },
    { header: 'Approved Date', accessor: (r) => formatExportDateTime(r.approvedAt as string) },
];

// ==================== DAILY FIELD REPORT EXPORT ====================

export const DAILY_REPORT_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'Report ID', accessor: (r) => safeValue(r.id) },
    { header: 'Date', accessor: (r) => formatExportDate(r.date as string) },
    { header: 'Project Name', accessor: (r) => safeValue(r.projectName) },
    { header: 'EP Number', accessor: (r) => safeValue(r.epNumber) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },

    // Oil Info
    { header: 'Oil Type', accessor: (r) => safeValue(r.oilTypeName) },
    { header: 'Oil Supplied By', accessor: (r) => safeValue(r.oilSuppliedByName) },
    { header: 'Asphalt Mix Type', accessor: (r) => safeValue(r.asphaltMixTypeName) },
    { header: 'Oil Grade', accessor: (r) => safeValue(r.oilGradeName) },
    { header: 'High Grade', accessor: (r) => safeValue(r.highGradeName) },

    // Stations
    { header: 'Station Count', accessor: (r) => countArray(r.stations as any[]) },
    {
        header: 'Stations', accessor: (r) => {
            const stations = r.stations as any[];
            if (!stations || !stations.length) return '';
            return stations.map(s => `${s.fromStation} to ${s.toStation} (${s.sy} SY)`).join('; ');
        }
    },
    { header: 'Total Station SY', accessor: (r) => safeValue(r.totalSy) },

    // Materials
    { header: 'Material Count', accessor: (r) => countArray(r.materials as any[]) },
    {
        header: 'Materials', accessor: (r) => {
            const mats = r.materials as any[];
            if (!mats || !mats.length) return '';
            return mats.map(m => `${m.materialCode}: ${m.rollsUsed || 0} rolls, ${m.netSy || 0} net SY`).join('; ');
        }
    },
    { header: 'Total Net SY', accessor: (r) => safeValue(r.totalNetSy) },

    // Tack Coat
    { header: 'Tack Coat Type', accessor: (r) => safeValue(r.tackCoatTypeName) },
    { header: 'Tack Start Gallons', accessor: (r) => safeValue(r.tackStartGallons) },
    { header: 'Tack End Gallons', accessor: (r) => safeValue(r.tackEndGallons) },
    { header: 'Tack Total Used', accessor: (r) => safeValue(r.tackTotalGallons) },
    { header: 'Application Rate (gal/SY)', accessor: (r) => safeValue(r.applicationRate) },
    { header: 'Grid Placed Beneath', accessor: (r) => formatBoolean(r.gridBeneath as boolean) },
    { header: 'Grid Placed On Top', accessor: (r) => formatBoolean(r.gridOnTop as boolean) },

    // Standby
    { header: 'Standby - Customer', accessor: (r) => formatBoolean(r.standbyCustomer as boolean) },
    { header: 'Standby - Demobilization', accessor: (r) => formatBoolean(r.standbyDemobilization as boolean) },
    { header: 'Standby - Weather', accessor: (r) => formatBoolean(r.standbyWeather as boolean) },
    { header: 'Standby Duration', accessor: (r) => safeValue(r.standbyDuration) },
    { header: 'Additional Notes', accessor: (r) => safeValue(r.comments) },

    // Signatures
    { header: 'IFI Supervisor', accessor: (r) => safeValue(r.supervisorName) },
    { header: 'IFI Supervisor Signed', accessor: (r) => formatBoolean(!!r.supervisorSignature) },
    { header: 'Contractor Rep', accessor: (r) => safeValue(r.contractorPocName) },
    { header: 'Contractor Signed', accessor: (r) => formatBoolean(!!r.contractorSignature) },

    // Meta
    { header: 'Created By', accessor: (r) => safeValue(r.createdBy) },
    { header: 'Created Date', accessor: (r) => formatExportDateTime(r.createdAt as string) },
];

// ==================== ISSUES LOG EXPORT ====================

export const ISSUES_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'Issue ID', accessor: (r) => safeValue(r.id) },
    { header: 'Date', accessor: (r) => formatExportDate(r.date as string) },
    { header: 'Time', accessor: (r) => safeValue(r.time) },
    { header: 'Project Name', accessor: (r) => safeValue(r.projectName) },
    { header: 'EP Number', accessor: (r) => safeValue(r.epNumber) },
    { header: 'Issue Type', accessor: (r) => safeValue(r.issueTypeName) },
    { header: 'Priority', accessor: (r) => safeValue(r.flag) },
    { header: 'Description', accessor: (r) => safeValue(r.description) },
    { header: 'Temperature (°F)', accessor: (r) => safeValue(r.temperature) },
    { header: 'Rain', accessor: (r) => formatBoolean(r.rain as boolean) },
    { header: 'Rain Duration', accessor: (r) => safeValue(r.rainDuration) },
    { header: 'Plant Breakdown', accessor: (r) => formatBoolean(r.plantBreakdown as boolean) },
    { header: 'Breakdown Duration', accessor: (r) => safeValue(r.breakdownDuration) },
    { header: 'Photos Count', accessor: (r) => countArray(r.photos as any[]) },
    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Created By', accessor: (r) => safeValue(r.createdBy) },
    { header: 'Created Date', accessor: (r) => formatExportDateTime(r.createdAt as string) },
];

// ==================== SAFETY (JHA) EXPORT ====================

export const SAFETY_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'JHA ID', accessor: (r) => safeValue(r.id) },
    { header: 'Form Number', accessor: (r) => safeValue(r.formNumber) },
    { header: 'Date', accessor: (r) => formatExportDate(r.date as string) },
    { header: 'Time', accessor: (r) => safeValue(r.time) },
    { header: 'Shift', accessor: (r) => safeValue(r.shift) },
    { header: 'Project Name', accessor: (r) => safeValue(r.projectName) },
    { header: 'EP Number', accessor: (r) => safeValue(r.epNumber) },
    { header: 'Location', accessor: (r) => safeValue(r.location) },
    { header: 'Job Description', accessor: (r) => safeValue(r.jobDescription) },
    { header: 'Completed By', accessor: (r) => safeValue(r.completedBy) },

    // Tasks
    { header: 'Task Count', accessor: (r) => countArray(r.tasks as any[]) },
    {
        header: 'Tasks', accessor: (r) => {
            const tasks = r.tasks as any[];
            if (!tasks || !tasks.length) return '';
            return tasks.map((t, i) => `${i + 1}. ${t.description}`).join('; ');
        }
    },
    {
        header: 'Hazards', accessor: (r) => {
            const tasks = r.tasks as any[];
            if (!tasks || !tasks.length) return '';
            return tasks.flatMap(t => t.hazards || []).join('; ');
        }
    },

    // Crew
    { header: 'Crew Count', accessor: (r) => countArray(r.crewAttendance as any[]) },
    { header: 'Crew Names', accessor: (r) => flattenArray(r.crewAttendance as any[], 'employeeName') },

    { header: 'Additional Notes', accessor: (r) => safeValue(r.notes) },
    { header: 'Signature Present', accessor: (r) => formatBoolean(!!r.signature) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Created By', accessor: (r) => safeValue(r.createdBy) },
    { header: 'Created Date', accessor: (r) => formatExportDateTime(r.createdAt as string) },
];

// ==================== PRE-CONSTRUCTION EXPORT ====================

export const PRECONSTRUCTION_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'Checklist ID', accessor: (r) => safeValue(r.id) },
    { header: 'Date', accessor: (r) => formatExportDate(r.date as string) },
    { header: 'Project Name', accessor: (r) => safeValue(r.projectName) },
    { header: 'EP Number', accessor: (r) => safeValue(r.epNumber) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Completed By', accessor: (r) => safeValue(r.completedBy) },

    // Checklist items - flattened
    { header: 'Total Items', accessor: (r) => countArray(r.checklistItems as any[]) },
    {
        header: 'Completed Items', accessor: (r) => {
            const items = r.checklistItems as any[];
            if (!items) return 0;
            return items.filter(i => i.checked).length;
        }
    },
    {
        header: 'Completion %', accessor: (r) => {
            const items = r.checklistItems as any[];
            if (!items || !items.length) return '0%';
            const completed = items.filter(i => i.checked).length;
            return `${Math.round((completed / items.length) * 100)}%`;
        }
    },

    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
    { header: 'Signature Present', accessor: (r) => formatBoolean(!!r.signature) },
    { header: 'Created By', accessor: (r) => safeValue(r.createdBy) },
    { header: 'Created Date', accessor: (r) => formatExportDateTime(r.createdAt as string) },
];

// ==================== BILL OF LADING EXPORT ====================

export const BOL_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'BOL ID', accessor: (r) => safeValue(r.id) },
    { header: 'BOL Number', accessor: (r) => safeValue(r.bolNumber) },
    { header: 'Date', accessor: (r) => formatExportDate(r.date as string) },
    { header: 'Project Name', accessor: (r) => safeValue(r.projectName) },
    { header: 'EP Number', accessor: (r) => safeValue(r.epNumber) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },

    // Shipment Info
    { header: 'Shipper', accessor: (r) => safeValue(r.shipperName) },
    { header: 'Ship From', accessor: (r) => safeValue(r.shipFrom) },
    { header: 'Ship To', accessor: (r) => safeValue(r.shipTo) },
    { header: 'Carrier', accessor: (r) => safeValue(r.carrierName) },
    { header: 'Truck Number', accessor: (r) => safeValue(r.truckNumber) },
    { header: 'Trailer Number', accessor: (r) => safeValue(r.trailerNumber) },

    // Materials
    { header: 'Material Count', accessor: (r) => countArray(r.materials as any[]) },
    {
        header: 'Materials', accessor: (r) => {
            const mats = r.materials as any[];
            if (!mats || !mats.length) return '';
            return mats.map(m => `${m.description}: ${m.quantity} ${m.unit}`).join('; ');
        }
    },
    { header: 'Total Rolls', accessor: (r) => sumArrayField(r.materials as any[], 'quantity') },

    // Dates
    { header: 'Ship Date', accessor: (r) => formatExportDate(r.shipDate as string) },
    { header: 'Delivery Date', accessor: (r) => formatExportDate(r.deliveryDate as string) },
    { header: 'Received Date', accessor: (r) => formatExportDate(r.receivedDate as string) },

    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
    { header: 'Signature Present', accessor: (r) => formatBoolean(!!r.signature) },
    { header: 'Created By', accessor: (r) => safeValue(r.createdBy) },
    { header: 'Created Date', accessor: (r) => formatExportDateTime(r.createdAt as string) },
];

// ==================== EMPLOYEES EXPORT ====================

export const EMPLOYEES_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'Employee ID', accessor: (r) => safeValue(r.id) },
    { header: 'First Name', accessor: (r) => safeValue(r.firstName) },
    { header: 'Last Name', accessor: (r) => safeValue(r.lastName) },
    { header: 'Full Name', accessor: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() },
    { header: 'Email', accessor: (r) => safeValue(r.email) },
    { header: 'Phone', accessor: (r) => safeValue(r.phone) },
    { header: 'Role', accessor: (r) => safeValue(r.role) },
    { header: 'Department', accessor: (r) => safeValue(r.department) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Hire Date', accessor: (r) => formatExportDate(r.hireDate as string) },
    { header: 'Certifications', accessor: (r) => flattenArray(r.certifications as any[], 'name') },
    { header: 'Emergency Contact', accessor: (r) => safeValue(r.emergencyContactName) },
    { header: 'Emergency Phone', accessor: (r) => safeValue(r.emergencyContactPhone) },
    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
];

// ==================== MATERIALS EXPORT ====================

export const MATERIALS_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'Material ID', accessor: (r) => safeValue(r.id) },
    { header: 'Material Code', accessor: (r) => safeValue(r.code) },
    { header: 'Description', accessor: (r) => safeValue(r.description) },
    { header: 'Category', accessor: (r) => safeValue(r.category) },
    { header: 'UOM', accessor: (r) => safeValue(r.uom) },
    { header: 'Roll Area (SY)', accessor: (r) => safeValue(r.rollArea) },
    { header: 'Width', accessor: (r) => safeValue(r.width) },
    { header: 'Length', accessor: (r) => safeValue(r.length) },
    { header: 'Unit Cost', accessor: (r) => safeValue(r.unitCost) },
    { header: 'Vendor', accessor: (r) => safeValue(r.vendorName) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
];

// ==================== EQUIPMENT EXPORT ====================

export const EQUIPMENT_EXPORT_COLUMNS: ExportColumnMapping[] = [
    { header: 'Equipment ID', accessor: (r) => safeValue(r.id) },
    { header: 'Equipment Number', accessor: (r) => safeValue(r.equipmentNumber) },
    { header: 'Name', accessor: (r) => safeValue(r.name) },
    { header: 'Category', accessor: (r) => safeValue(r.category) },
    { header: 'Type', accessor: (r) => safeValue(r.type) },
    { header: 'Make', accessor: (r) => safeValue(r.make) },
    { header: 'Model', accessor: (r) => safeValue(r.model) },
    { header: 'Year', accessor: (r) => safeValue(r.year) },
    { header: 'Serial Number', accessor: (r) => safeValue(r.serialNumber) },
    { header: 'VIN', accessor: (r) => safeValue(r.vin) },
    { header: 'License Plate', accessor: (r) => safeValue(r.licensePlate) },
    { header: 'Status', accessor: (r) => safeValue(r.status) },
    { header: 'Assigned To', accessor: (r) => safeValue(r.assignedTo) },
    { header: 'Current Project', accessor: (r) => safeValue(r.currentProject) },
    { header: 'Last Service Date', accessor: (r) => formatExportDate(r.lastServiceDate as string) },
    { header: 'Next Service Due', accessor: (r) => formatExportDate(r.nextServiceDate as string) },
    { header: 'Notes', accessor: (r) => safeValue(r.notes) },
];
