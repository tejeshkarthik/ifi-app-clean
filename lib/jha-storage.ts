// JHA (Job Hazard Analysis) storage

export interface JHATask {
    id: string;
    taskNo: number;
    description: string;
    hazards: string;
    isDefault: boolean;
}

export interface JHACrewMember {
    employeeId: string;
    employeeName: string;
    attended: boolean;
}

export interface JHA {
    id: string;
    formNo: string;
    date: string;
    projectId: string;
    projectName: string;
    epNumber: string;
    location: string;
    jobDescription: string;
    timeOfDay: 'AM' | 'PM';
    shiftId: string;
    shiftName: string;
    completedById: string;
    completedByName: string;
    tasks: JHATask[];
    additionalNotes: string;
    crewAttendance: JHACrewMember[];
    crewCount: number;
    signature: string; // base64 data URL
    signedName: string;
    signedDate: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

// Default tasks that appear on every new JHA
export const DEFAULT_JHA_TASKS: Omit<JHATask, 'id'>[] = [
    { taskNo: 1, description: 'Cutting materials (fabrics with box cutters/knives)', hazards: 'Cuts to hands and fingers', isDefault: true },
    { taskNo: 2, description: 'Handling sharp materials', hazards: 'Puncture wounds', isDefault: true },
    { taskNo: 3, description: 'Cutting wire, rope and materials', hazards: 'Cut hands and fingers; particles in eyes', isDefault: true },
    { taskNo: 4, description: 'Lifting materials', hazards: 'Back injury; strains; sprains; muscle pulls', isDefault: true },
    { taskNo: 5, description: 'Weed eating; loading mats', hazards: 'Cuts to fingers and hands', isDefault: true },
    { taskNo: 6, description: 'Work bending over; on knees (ergonomics)', hazards: 'Hurt or bruise knees; pull muscles; strain/sprain', isDefault: true },
    { taskNo: 7, description: 'Weather challenges', hazards: 'Cold/Hot - overheated during spring, summer', isDefault: true },
    { taskNo: 8, description: 'Warehouse operations', hazards: 'Fans to be operational at all times in warehouse', isDefault: true },
    { taskNo: 9, description: 'Traffic zone work', hazards: 'Stay inside cones; be alert for vehicles', isDefault: true },
    { taskNo: 10, description: 'Hot oil transfer', hazards: 'Proper PPE required; hot oil shields', isDefault: true },
];

const STORAGE_KEY = 'ifi_jha_forms';
const DEFAULT_TASKS_KEY = 'ifi_jha_default_tasks';

// Generate JHA form number
export function generateJHAFormNo(date: string): string {
    const jhas = getJHAs();
    const dateStr = date.replace(/-/g, '');
    const todayJHAs = jhas.filter(j => j.date === date);
    const seq = (todayJHAs.length + 1).toString().padStart(3, '0');
    return `JHA-${dateStr}-${seq}`;
}

// Get default tasks (from storage or constants)
export function getDefaultTasks(): Omit<JHATask, 'id'>[] {
    if (typeof window === 'undefined') return DEFAULT_JHA_TASKS;

    const stored = localStorage.getItem(DEFAULT_TASKS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return DEFAULT_JHA_TASKS;
        }
    }
    return DEFAULT_JHA_TASKS;
}

// Save default tasks
export function saveDefaultTasks(tasks: Omit<JHATask, 'id'>[]): void {
    localStorage.setItem(DEFAULT_TASKS_KEY, JSON.stringify(tasks));
}

// Create initial tasks for a new JHA
export function createInitialTasks(): JHATask[] {
    return getDefaultTasks().map((task, index) => ({
        ...task,
        id: crypto.randomUUID(),
        taskNo: index + 1,
    }));
}

// Get all JHAs
export function getJHAs(): JHA[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get JHA by ID
export function getJHAById(id: string): JHA | null {
    return getJHAs().find(j => j.id === id) || null;
}

// Save JHA (create or update)
export function saveJHA(jha: JHA): JHA {
    const jhas = getJHAs();
    const index = jhas.findIndex(j => j.id === jha.id);

    if (index >= 0) {
        jhas[index] = { ...jha, updatedAt: new Date().toISOString() };
    } else {
        jhas.push({ ...jha, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(jhas));
    return jha;
}

// Delete JHA
export function deleteJHA(id: string): boolean {
    const jhas = getJHAs();
    const index = jhas.findIndex(j => j.id === id);

    if (index === -1) return false;

    jhas.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jhas));
    return true;
}

// Get new empty JHA
export function getEmptyJHA(date: string): Omit<JHA, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        formNo: generateJHAFormNo(date),
        date,
        projectId: '',
        projectName: '',
        epNumber: '',
        location: '',
        jobDescription: 'General Operations',
        timeOfDay: 'AM',
        shiftId: '',
        shiftName: '',
        completedById: '',
        completedByName: '',
        tasks: createInitialTasks(),
        additionalNotes: '',
        crewAttendance: [],
        crewCount: 0,
        signature: '',
        signedName: '',
        signedDate: '',
        status: 'draft',
    };
}
