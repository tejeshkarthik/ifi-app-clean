// Bill of Lading storage and aggregation
// Generates BOLs from approved Daily Field Reports

import { getMaterialUsageLogs, type MaterialUsageLog } from './forms-storage';

// ==================== INTERFACES ====================

export interface MaterialSummary {
    materialCode: string;
    materialDescription: string;
    totalRolls: number; // Full + Half/2
    totalNetSy: number;
}

export interface StandbySummary {
    date: string;
    reasons: string[];
    duration: string;
}

export interface BillOfLading {
    id: string;
    projectId: string;
    projectName: string;
    epNumber: string;
    fromDate: string;
    toDate: string;

    // Aggregated data
    materialsSummary: MaterialSummary[];
    standbySummary: StandbySummary[];
    totalGallonsUsed: number;
    totalNetSy: number;

    // BOL specific fields
    description: string; // Default: "FIBERGLASS REINFORCED FABRIC"
    notes: string;

    // Source report IDs
    sourceReportIds: string[];

    // Signatures
    supervisorSignature: string;
    supervisorName: string;
    customerSignature: string;
    customerName: string;

    // Meta
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

// ==================== STORAGE KEY ====================

const BOL_STORAGE_KEY = 'ifi_bills_of_lading';

// ==================== CRUD OPERATIONS ====================

export function getBillsOfLading(): BillOfLading[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(BOL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function getBillOfLadingById(id: string): BillOfLading | null {
    const bols = getBillsOfLading();
    return bols.find(b => b.id === id) || null;
}

export function saveBillOfLading(bol: BillOfLading): BillOfLading {
    const bols = getBillsOfLading();
    const existingIndex = bols.findIndex(b => b.id === bol.id);

    if (existingIndex >= 0) {
        bols[existingIndex] = { ...bol, updatedAt: new Date().toISOString() };
    } else {
        bols.push({
            ...bol,
            id: bol.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    localStorage.setItem(BOL_STORAGE_KEY, JSON.stringify(bols));
    return existingIndex >= 0 ? bols[existingIndex] : bols[bols.length - 1];
}

export function deleteBillOfLading(id: string): boolean {
    const bols = getBillsOfLading();
    const filtered = bols.filter(b => b.id !== id);
    if (filtered.length === bols.length) return false;
    localStorage.setItem(BOL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

// ==================== AGGREGATION ENGINE ====================

export function generateBOLFromReports(
    projectId: string,
    fromDate: string,
    toDate: string
): Omit<BillOfLading, 'id' | 'createdAt' | 'updatedAt'> | null {
    // Get all approved Daily Field Reports for the project within date range
    const allReports = getMaterialUsageLogs();
    const reports = allReports.filter(r =>
        r.projectId === projectId &&
        r.status === 'approved' &&
        r.date >= fromDate &&
        r.date <= toDate
    );

    if (reports.length === 0) return null;

    // Aggregate materials by code
    const materialsMap = new Map<string, MaterialSummary>();

    reports.forEach(report => {
        report.materials.forEach(mat => {
            const existing = materialsMap.get(mat.materialCode);
            const rollsEquivalent = mat.fullRolls + (mat.halfRolls / 2);

            if (existing) {
                existing.totalRolls += rollsEquivalent;
                existing.totalNetSy += mat.netSy;
            } else {
                materialsMap.set(mat.materialCode, {
                    materialCode: mat.materialCode,
                    materialDescription: mat.materialDescription,
                    totalRolls: rollsEquivalent,
                    totalNetSy: mat.netSy,
                });
            }
        });
    });

    // Aggregate standby days
    const standbySummary: StandbySummary[] = reports
        .filter(r => r.standbyCustomer || r.standbyDemobilization || r.standbyWeather)
        .map(r => {
            const reasons: string[] = [];
            if (r.standbyCustomer) reasons.push('Customer');
            if (r.standbyDemobilization) reasons.push('Demobilization');
            if (r.standbyWeather) reasons.push('Weather');

            return {
                date: r.date,
                reasons,
                duration: r.standbyDuration || '',
            };
        });

    // Calculate totals
    const totalGallonsUsed = reports.reduce((sum, r) => sum + r.tackTotalGallons, 0);
    const totalNetSy = Array.from(materialsMap.values()).reduce((sum, m) => sum + m.totalNetSy, 0);

    // Get project info from first report
    const firstReport = reports[0];

    return {
        projectId,
        projectName: firstReport.projectName,
        epNumber: firstReport.epNumber,
        fromDate,
        toDate,
        materialsSummary: Array.from(materialsMap.values()),
        standbySummary,
        totalGallonsUsed,
        totalNetSy,
        description: 'FIBERGLASS REINFORCED FABRIC',
        notes: '',
        sourceReportIds: reports.map(r => r.id),
        supervisorSignature: '',
        supervisorName: firstReport.supervisorName || '',
        customerSignature: '',
        customerName: '',
        status: 'draft',
        createdBy: '',
    };
}

// ==================== HELPERS ====================

export function formatBOLNumber(bol: BillOfLading): string {
    const date = new Date(bol.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `BOL-${year}${month}-${bol.id.slice(0, 6).toUpperCase()}`;
}

export function getEmptyBOL(): Omit<BillOfLading, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        projectId: '',
        projectName: '',
        epNumber: '',
        fromDate: '',
        toDate: '',
        materialsSummary: [],
        standbySummary: [],
        totalGallonsUsed: 0,
        totalNetSy: 0,
        description: 'FIBERGLASS REINFORCED FABRIC',
        notes: '',
        sourceReportIds: [],
        supervisorSignature: '',
        supervisorName: '',
        customerSignature: '',
        customerName: '',
        status: 'draft',
        createdBy: '',
    };
}
