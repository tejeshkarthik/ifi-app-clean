// Projects storage

export interface ProjectMaterial {
    id: string;
    materialId: string;
    materialCode: string;
    description: string;
    totalEstimatedQty: number | null;
    uom: string;
    totalEstimatedRolls: number | null;
}

export interface ProjectEquipmentOwned {
    id: string;
    equipmentId: string;
    equipmentCode: string;
    equipmentName: string;
    category: string;
    startDate: string;
    returnDate: string;
}

export interface ProjectEquipmentThirdParty {
    id: string;
    description: string;
    vendor: string;
    poNumber: string;
}

export interface Project {
    id: string;
    isDraft: boolean;

    // Section 1: Profile
    name: string;
    epNumber: string;
    statusId: string;
    statusName: string;
    salespersonId: string;
    salespersonName: string;
    contractStatusId: string;
    contractStatusName: string;
    contractDocument: string | null;

    // Section 2: Location
    streetAddress: string;
    county: string;
    city: string;
    state: string;
    zip: string;
    gpsStart: string;
    gpsEnd: string;

    // Section 3: Personnel
    ownerId: string;
    ownerName: string;
    ownerAddress: string;
    ownerPocIds: string[];
    contractorId: string;
    contractorName: string;
    contractorAddress: string;
    contractorPocIds: string[];
    inspectorId: string;
    inspectorName: string;
    inspectorAddress: string;
    inspectorPocIds: string[];
    pmIds: string[];
    supervisorIds: string[];
    leadIds: string[];
    workerIds: string[];

    // Section 4: Schedule
    estimatedStartDate: string;
    estimatedEndDate: string;
    estimatedDurationDays: number | null;
    estimatedDateOnSite: string;
    shiftId: string;
    shiftName: string;
    scheduleNotes: string;

    // Section 5: Documents
    submittals: string[];
    plans: string[];
    signedContract: string | null;

    // Section 6: Scope - Materials
    materials: ProjectMaterial[];

    // Section 7: Scope - Tack Coat
    tackCoatTypeId: string;
    tackCoatTypeName: string;
    tackCoatQty: number | null;
    tackCoatUomId: string;
    tackCoatUomName: string;

    // Section 8: Scope - Equipment
    ownedEquipment: ProjectEquipmentOwned[];
    thirdPartyEquipment: ProjectEquipmentThirdParty[];

    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'ifi_projects';

export function getDefaultProject(): Omit<Project, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        isDraft: true,
        name: '',
        epNumber: '',
        statusId: '',
        statusName: '',
        salespersonId: '',
        salespersonName: '',
        contractStatusId: '',
        contractStatusName: '',
        contractDocument: null,
        streetAddress: '',
        county: '',
        city: '',
        state: '',
        zip: '',
        gpsStart: '',
        gpsEnd: '',
        ownerId: '',
        ownerName: '',
        ownerAddress: '',
        ownerPocIds: [],
        contractorId: '',
        contractorName: '',
        contractorAddress: '',
        contractorPocIds: [],
        inspectorId: '',
        inspectorName: '',
        inspectorAddress: '',
        inspectorPocIds: [],
        pmIds: [],
        supervisorIds: [],
        leadIds: [],
        workerIds: [],
        estimatedStartDate: '',
        estimatedEndDate: '',
        estimatedDurationDays: null,
        estimatedDateOnSite: '',
        shiftId: '',
        shiftName: '',
        scheduleNotes: '',
        submittals: [],
        plans: [],
        signedContract: null,
        materials: [],
        tackCoatTypeId: '',
        tackCoatTypeName: '',
        tackCoatQty: null,
        tackCoatUomId: '',
        tackCoatUomName: '',
        ownedEquipment: [],
        thirdPartyEquipment: [],
    };
}

// Get all projects
export function getProjects(): Project[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get project by ID
export function getProjectById(id: string): Project | null {
    return getProjects().find(p => p.id === id) || null;
}

// Add project
export function addProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const projects = getProjects();

    const newProject: Project = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    projects.push(newProject);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return newProject;
}

// Update project
export function updateProject(id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Project | null {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) return null;

    projects[index] = {
        ...projects[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return projects[index];
}

// Delete project
export function deleteProject(id: string): boolean {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) return false;

    projects.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
}
