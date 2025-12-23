// Equipment storage

export interface Equipment {
    id: string;
    code: string;
    name: string;
    categoryId: string;
    categoryName: string;
    ownership: 'Owned' | 'Rented';
    vendor: string;
    poNumber: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const OWNERSHIP_OPTIONS = ['Owned', 'Rented'] as const;
export type OwnershipType = typeof OWNERSHIP_OPTIONS[number];

const STORAGE_KEY = 'ifi_equipment';

// Get all equipment
export function getEquipment(): Equipment[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get active equipment
export function getActiveEquipment(): Equipment[] {
    return getEquipment().filter(e => e.isActive);
}

// Get equipment by ID
export function getEquipmentById(id: string): Equipment | null {
    return getEquipment().find(e => e.id === id) || null;
}

// Add equipment
export function addEquipmentItem(data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Equipment {
    const equipment = getEquipment();

    const newEquipment: Equipment = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    equipment.push(newEquipment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
    return newEquipment;
}

// Update equipment
export function updateEquipmentItem(id: string, data: Partial<Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>>): Equipment | null {
    const equipment = getEquipment();
    const index = equipment.findIndex(e => e.id === id);

    if (index === -1) return null;

    equipment[index] = {
        ...equipment[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
    return equipment[index];
}

// Delete equipment
export function deleteEquipmentItem(id: string): boolean {
    const equipment = getEquipment();
    const index = equipment.findIndex(e => e.id === id);

    if (index === -1) return false;

    equipment.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
    return true;
}
