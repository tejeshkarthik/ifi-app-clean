// Workflows storage

export interface WorkflowLevel {
    id: string;
    levelNumber: number;
    levelType: 'Users' | 'Roles';
    approvalType: 'All' | 'Any';
    approverIds: string[];
    approverNames: string[];
}

export type FormType =
    | 'timesheet'
    | 'material_usage'
    | 'issues_log'
    | 'safety_jha'
    | 'pre_construction'
    | 'bill_of_lading';

export const FORM_TYPES: { value: FormType; label: string }[] = [
    { value: 'timesheet', label: 'Timesheet' },
    { value: 'material_usage', label: 'Material Usage Log' },
    { value: 'issues_log', label: 'Issues Log' },
    { value: 'safety_jha', label: 'Safety Form (JHA)' },
    { value: 'pre_construction', label: 'Pre-Construction Checklist' },
    { value: 'bill_of_lading', label: 'Bill of Lading' },
];

export const ROLE_OPTIONS = ['Admin', 'PM', 'Supervisor'] as const;

export interface Workflow {
    id: string;
    name: string;
    isActive: boolean;
    levels: WorkflowLevel[];
    assignedForms: FormType[];
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'ifi_workflows';

// Get all workflows
export function getWorkflows(): Workflow[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get active workflows
export function getActiveWorkflows(): Workflow[] {
    return getWorkflows().filter(w => w.isActive);
}

// Get workflow by ID
export function getWorkflowById(id: string): Workflow | null {
    return getWorkflows().find(w => w.id === id) || null;
}

// Get workflow for a specific form type
export function getWorkflowForForm(formType: FormType): Workflow | null {
    return getActiveWorkflows().find(w => w.assignedForms.includes(formType)) || null;
}

// Add workflow
export function addWorkflow(data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Workflow {
    const workflows = getWorkflows();

    const newWorkflow: Workflow = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    workflows.push(newWorkflow);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    return newWorkflow;
}

// Update workflow
export function updateWorkflow(id: string, data: Partial<Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>>): Workflow | null {
    const workflows = getWorkflows();
    const index = workflows.findIndex(w => w.id === id);

    if (index === -1) return null;

    workflows[index] = {
        ...workflows[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    return workflows[index];
}

// Delete workflow
export function deleteWorkflow(id: string): boolean {
    const workflows = getWorkflows();
    const index = workflows.findIndex(w => w.id === id);

    if (index === -1) return false;

    workflows.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    return true;
}
