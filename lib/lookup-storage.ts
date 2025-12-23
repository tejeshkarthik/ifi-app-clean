// Lookup table categories
export const LOOKUP_CATEGORIES = [
    { id: 'asphalt_mix_types', name: 'Asphalt Mix Types', description: 'Types of asphalt mix (Type B, Type C, etc.)' },
    { id: 'oil_types', name: 'Oil Types', description: 'Oil classification options' },
    { id: 'oil_grades', name: 'Oil Grades', description: 'Oil grade options' },
    { id: 'tack_coat_types', name: 'Tack Coat Types', description: 'Tack coat options' },
    { id: 'high_grade_types', name: 'High Grade Types', description: 'High grade options' },
    { id: 'standby_reasons', name: 'Standby Reasons', description: 'Reasons for standby' },
    { id: 'issue_types', name: 'Issue Types', description: 'Types of field issues' },
    { id: 'uom_types', name: 'UoM Types', description: 'Units of measurement (SY, RL, EA, etc.)' },
    { id: 'employee_classes', name: 'Employee Classes', description: 'Employee classification' },
    { id: 'employee_crafts', name: 'Employee Crafts', description: 'Employee craft types' },
    { id: 'equipment_categories', name: 'Equipment Categories', description: 'Equipment classification' },
    { id: 'project_status_types', name: 'Project Status Types', description: 'Project statuses' },
    { id: 'contract_status_types', name: 'Contract Status Types', description: 'Contract statuses' },
    { id: 'shift_types', name: 'Shift Types', description: 'Day/Night shift options' },
    { id: 'warehouse_locations', name: 'Warehouse Locations', description: 'Warehouse options' },
    { id: 'lane_types', name: 'Lane Types', description: 'Lane directions (EB, WB, NB, SB, etc.)' },
    { id: 'surface_types', name: 'Surface Types', description: 'Surface types (Milled, Levelup, etc.)' },
    { id: 'van_truck_types', name: 'Van/Truck Types', description: 'Vehicle options' },
    { id: 'pipe_length_options', name: 'Pipe Length Options', description: 'Pipe length specifications' },
] as const;

export type LookupCategoryId = typeof LOOKUP_CATEGORIES[number]['id'];

export interface LookupValue {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LookupData {
    [categoryId: string]: LookupValue[];
}

const STORAGE_KEY = 'ifi_lookup_tables';

// Initialize empty lookup tables
function getInitialData(): LookupData {
    const data: LookupData = {};
    LOOKUP_CATEGORIES.forEach(cat => {
        data[cat.id] = [];
    });
    return data;
}

// Get all lookup data
export function getLookupData(): LookupData {
    if (typeof window === 'undefined') return getInitialData();

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        const initial = getInitialData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }

    try {
        return JSON.parse(stored);
    } catch {
        return getInitialData();
    }
}

// Get values for a specific category
export function getLookupValues(categoryId: string): LookupValue[] {
    const data = getLookupData();
    return data[categoryId] || [];
}

// Get only active values for a category (for dropdowns)
export function getActiveLookupValues(categoryId: string): LookupValue[] {
    return getLookupValues(categoryId).filter(v => v.isActive);
}

// Add a new value
export function addLookupValue(categoryId: string, name: string, isActive: boolean = true): LookupValue {
    const data = getLookupData();
    const newValue: LookupValue = {
        id: crypto.randomUUID(),
        name,
        isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    if (!data[categoryId]) {
        data[categoryId] = [];
    }

    data[categoryId].push(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return newValue;
}

// Update a value
export function updateLookupValue(categoryId: string, valueId: string, updates: Partial<Pick<LookupValue, 'name' | 'isActive'>>): LookupValue | null {
    const data = getLookupData();
    const values = data[categoryId];

    if (!values) return null;

    const index = values.findIndex(v => v.id === valueId);
    if (index === -1) return null;

    values[index] = {
        ...values[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return values[index];
}

// Delete a value
export function deleteLookupValue(categoryId: string, valueId: string): boolean {
    const data = getLookupData();
    const values = data[categoryId];

    if (!values) return false;

    const index = values.findIndex(v => v.id === valueId);
    if (index === -1) return false;

    values.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
}

// Toggle active status
export function toggleLookupValueStatus(categoryId: string, valueId: string): LookupValue | null {
    const data = getLookupData();
    const values = data[categoryId];

    if (!values) return null;

    const value = values.find(v => v.id === valueId);
    if (!value) return null;

    return updateLookupValue(categoryId, valueId, { isActive: !value.isActive });
}
