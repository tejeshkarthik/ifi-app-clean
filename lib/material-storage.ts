// Materials storage

export interface Material {
    id: string;
    code: string;
    description: string;
    uomId: string;
    uomName: string;
    fullRollArea: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'ifi_materials';

// Get all materials
export function getMaterials(): Material[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get active materials
export function getActiveMaterials(): Material[] {
    return getMaterials().filter(m => m.isActive);
}

// Get material by ID
export function getMaterialById(id: string): Material | null {
    return getMaterials().find(m => m.id === id) || null;
}

// Get material by code
export function getMaterialByCode(code: string): Material | null {
    return getMaterials().find(m => m.code === code) || null;
}

// Add material
export function addMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Material {
    const materials = getMaterials();

    const newMaterial: Material = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    materials.push(newMaterial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    return newMaterial;
}

// Update material
export function updateMaterial(id: string, data: Partial<Omit<Material, 'id' | 'createdAt' | 'updatedAt'>>): Material | null {
    const materials = getMaterials();
    const index = materials.findIndex(m => m.id === id);

    if (index === -1) return null;

    materials[index] = {
        ...materials[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    return materials[index];
}

// Delete material
export function deleteMaterial(id: string): boolean {
    const materials = getMaterials();
    const index = materials.findIndex(m => m.id === id);

    if (index === -1) return false;

    materials.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    return true;
}
