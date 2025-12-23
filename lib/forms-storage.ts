// Forms storage for Material Usage Log and Issues Log
// Provides CRUD operations and TypeScript interfaces

// ==================== INTERFACES ====================

export interface StationTracking {
    id: string;
    fromStation: string;
    toStation: string;
    widthFt: number;
    sy: number;
    laneId: string;
    laneName: string;
}

export interface MaterialInstalled {
    id: string;
    materialId: string;
    materialCode: string;
    materialDescription: string;
    rollsUsed: number; // User enters
    rollArea: number; // SY per roll from global materials
    sy: number; // Auto-calculated: rollsUsed × rollArea, BUT editable (user can override)
    syOverride: boolean; // True if user manually edited sy
    overlapPercent: number; // 5%, 10%, 15% etc
    netSy: number; // Auto-calculated: sy × (1 - overlapPercent/100)
}

export interface MaterialUsageLog {
    id: string;
    projectId: string;
    projectName: string;
    epNumber: string;
    date: string;

    // Oil & Asphalt Information
    oilTypeId: string;
    oilTypeName: string;
    oilSuppliedById: string;
    oilSuppliedByName: string;
    asphaltMixTypeId: string;
    asphaltMixTypeName: string;
    oilGradeId: string;
    oilGradeName: string;
    highGradeId: string;
    highGradeName: string;

    // Station Tracking
    stations: StationTracking[];

    // Materials Installed
    materials: MaterialInstalled[];

    // Tack Coat / Oil Usage
    tackCoatTypeId: string;
    tackCoatTypeName: string;
    tackStartGallons: number;
    tackEndGallons: number;
    tackTotalGallons: number; // Auto-calculated
    gridBeneath: boolean;
    gridOnTop: boolean;
    applicationRate: number | null; // gal/SY - optional

    // Standby (replaced single reason with checkboxes)
    standbyCustomer: boolean;
    standbyDemobilization: boolean;
    standbyWeather: boolean;
    standbyDuration: string; // e.g., "2 hours", "Full day"
    comments: string;

    // Signatures
    supervisorId: string;
    supervisorName: string;
    supervisorSignature: string; // base64
    contractorPocId: string;
    contractorPocName: string;
    contractorSignature: string; // base64

    // Calculated totals
    totalSy: number; // Sum of station SY
    totalNetSy: number; // Sum of material Net SY

    // Meta
    status: 'draft' | 'awaiting_signatures' | 'pending' | 'approved' | 'rejected';
    approvalLevel?: number;
    approvalHistory?: {
        level: number;
        status: 'approved' | 'rejected';
        byUserId: string;
        byUserName: string;
        date: string;
        comment?: string;
    }[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface IssuesLog {
    id: string;
    projectId: string;
    projectName: string;
    date: string;
    time: string;
    issueTypeId: string;
    issueTypeName: string;
    flag: 'normal' | 'urgent';
    description: string;
    temperature: number | null;
    hasRain: boolean;
    rainDuration: string;
    hasPlantBreakdown: boolean;
    plantBreakdownDuration: string;
    photos: string[]; // Base64 or URLs
    reportedById: string;
    reportedByName: string;
    notes: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

// ==================== STORAGE KEYS ====================

const MATERIAL_USAGE_KEY = 'ifi_material_usage_logs';
const ISSUES_LOG_KEY = 'ifi_issues_logs';

// ==================== MATERIAL USAGE LOG ====================

export function getMaterialUsageLogs(): MaterialUsageLog[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(MATERIAL_USAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function getMaterialUsageLogById(id: string): MaterialUsageLog | null {
    const logs = getMaterialUsageLogs();
    return logs.find(l => l.id === id) || null;
}

export function saveMaterialUsageLog(log: MaterialUsageLog): MaterialUsageLog {
    const logs = getMaterialUsageLogs();
    const existingIndex = logs.findIndex(l => l.id === log.id);

    if (existingIndex >= 0) {
        logs[existingIndex] = { ...log, updatedAt: new Date().toISOString() };
    } else {
        logs.push({
            ...log,
            id: log.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    localStorage.setItem(MATERIAL_USAGE_KEY, JSON.stringify(logs));
    return existingIndex >= 0 ? logs[existingIndex] : logs[logs.length - 1];
}

export function deleteMaterialUsageLog(id: string): boolean {
    const logs = getMaterialUsageLogs();
    const filtered = logs.filter(l => l.id !== id);
    if (filtered.length === logs.length) return false;
    localStorage.setItem(MATERIAL_USAGE_KEY, JSON.stringify(filtered));
    return true;
}

// ==================== ISSUES LOG ====================

export function getIssuesLogs(): IssuesLog[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(ISSUES_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function getIssuesLogById(id: string): IssuesLog | null {
    const logs = getIssuesLogs();
    return logs.find(l => l.id === id) || null;
}

export function saveIssuesLog(log: IssuesLog): IssuesLog {
    const logs = getIssuesLogs();
    const existingIndex = logs.findIndex(l => l.id === log.id);

    if (existingIndex >= 0) {
        logs[existingIndex] = { ...log, updatedAt: new Date().toISOString() };
    } else {
        logs.push({
            ...log,
            id: log.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    localStorage.setItem(ISSUES_LOG_KEY, JSON.stringify(logs));
    return existingIndex >= 0 ? logs[existingIndex] : logs[logs.length - 1];
}

export function deleteIssuesLog(id: string): boolean {
    const logs = getIssuesLogs();
    const filtered = logs.filter(l => l.id !== id);
    if (filtered.length === logs.length) return false;
    localStorage.setItem(ISSUES_LOG_KEY, JSON.stringify(filtered));
    return true;
}

// ==================== CALCULATION HELPERS ====================

export function calculateSy(rollsUsed: number, rollArea: number): number {
    return rollsUsed * rollArea;
}

export function calculateNetSy(sy: number, overlapPercent: number): number {
    return sy * (1 - overlapPercent / 100);
}

export function calculateTackTotal(startGallons: number, endGallons: number): number {
    return Math.max(0, startGallons - endGallons);
}
