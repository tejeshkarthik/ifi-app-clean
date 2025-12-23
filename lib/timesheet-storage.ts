// Timesheet storage

export type TimesheetStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';

export interface TimeEntry {
    id: string;
    employeeId: string;
    employeeName: string;
    certifiedIn: string;
    certifiedOut: string;
    nonCertifiedIn: string;
    nonCertifiedOut: string;
    totalHours: number;
}

export interface Timesheet {
    id: string;
    projectId: string;
    projectName: string;
    epNumber: string;
    date: string;
    shiftId: string;
    shiftName: string;
    entries: TimeEntry[];
    notes: string;
    status: TimesheetStatus;
    submittedAt: string | null;
    submittedBy: string | null;
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
}

const STORAGE_KEY = 'ifi_timesheets';

// Calculate total hours from time entries
export function calculateTotalHours(inTime: string, outTime: string): number {
    if (!inTime || !outTime) return 0;

    const [inHour, inMin] = inTime.split(':').map(Number);
    const [outHour, outMin] = outTime.split(':').map(Number);

    let hours = outHour - inHour;
    let mins = outMin - inMin;

    if (mins < 0) {
        hours -= 1;
        mins += 60;
    }

    // Handle overnight shifts
    if (hours < 0) {
        hours += 24;
    }

    return Math.round((hours + mins / 60) * 100) / 100;
}

// Calculate combined total hours (certified + non-certified)
export function calculateEntryTotalHours(entry: TimeEntry): number {
    const certifiedHours = calculateTotalHours(entry.certifiedIn, entry.certifiedOut);
    const nonCertifiedHours = calculateTotalHours(entry.nonCertifiedIn, entry.nonCertifiedOut);
    return Math.round((certifiedHours + nonCertifiedHours) * 100) / 100;
}

// Get all timesheets
export function getTimesheets(): Timesheet[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get timesheet by ID
export function getTimesheetById(id: string): Timesheet | null {
    return getTimesheets().find(t => t.id === id) || null;
}

// Add timesheet
export function addTimesheet(data: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>): Timesheet {
    const timesheets = getTimesheets();

    const newTimesheet: Timesheet = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    timesheets.push(newTimesheet);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timesheets));
    return newTimesheet;
}

// Update timesheet
export function updateTimesheet(id: string, data: Partial<Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>>): Timesheet | null {
    const timesheets = getTimesheets();
    const index = timesheets.findIndex(t => t.id === id);

    if (index === -1) return null;

    timesheets[index] = {
        ...timesheets[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(timesheets));
    return timesheets[index];
}

// Delete timesheet
export function deleteTimesheet(id: string): boolean {
    const timesheets = getTimesheets();
    const index = timesheets.findIndex(t => t.id === id);

    if (index === -1) return false;

    timesheets.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timesheets));
    return true;
}
