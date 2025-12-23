// Pre-Construction Checklist Storage
// Provides TypeScript interfaces and CRUD operations

// ==================== INTERFACES ====================

export interface SurfaceTypeEntry {
    type: 'Milled' | 'Levelup' | 'Seal Coat';
    selected: boolean;
    rate: number; // gallons per SY
    gallons: number;
    lbs: number;
}

export interface MaterialEntry {
    id: string;
    code: string;
    description: string;
    selected: boolean;
    qty: number;
}

export interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

export interface PreConstructionChecklist {
    id: string;
    formNumber: string;

    // Project
    projectId: string;
    projectName: string;
    epNumber: string;

    // Project Team
    projectTeam: string[]; // Employee IDs
    projectTeamNames: string[];
    salesPerson: string[]; // Employee IDs
    salesPersonNames: string[];

    // Contractor Info
    contractor: string;
    contractorId: string;
    superintendentId: string;
    superintendentName: string;
    superintendentPhone: string;
    superintendentEmail: string;
    contractorCell: string;
    contractorEmail: string;
    projectManager: string;
    pmPhone: string;
    pmEmail: string;
    subcontractContact: string;
    subcontractPhone: string;
    subcontractEmail: string;

    // Project Address
    projectAddress: string;

    // Special Instructions
    specialInstructions: string;

    // Project Type
    projectType: 'City' | 'State' | 'Private' | 'Airport' | 'County' | 'Port' | 'Other' | '';
    projectTypeOther: string;

    // Day/Night
    dayTime: boolean;
    nightTime: boolean;

    // Notification
    rubberTireNotification: boolean;

    // Plans
    plansReviewedById: string;
    plansReviewedByName: string;

    // Submittals
    submittals: 'Approved' | 'Pending' | 'Not Approved' | '';

    // Project Details
    contractNumber: string;
    estimatedStartDate: string;
    estimatedDuration: string;
    equipmentOnSiteDate: string;

    // Materials
    materials: MaterialEntry[];
    cutRollsRequired: boolean;
    cutRollSize: string;
    cutRollQty: number;
    extensionBarsRequired: boolean;
    warehouse: string;

    // Tack Coat
    projectSY: number;
    surfaceTypes: SurfaceTypeEntry[];
    tackCoatTypes: string[];

    // Oil Source
    oilSource: string;
    oilCompany: string;
    oilAddress: string;
    oilBusHrs: string;
    oilPULoad: string;
    oilPOIFI: string;
    oilContact1: string;
    oilContact2: string;

    // Equipment - Tractor
    tractorType: 'Kubota with rollers' | 'Kubota with no rollers' | '';
    numTractors: number;
    trailerUnit: string;
    tractorUnit: string;

    // Equipment - Blowers
    backpackBlowers: boolean;
    gasBlower4Wheeler: boolean | null;

    // Equipment - Pipe Length
    pipeLengths: string[];

    // Equipment - Other Items
    otherItems: string[];

    // Equipment - Van/Truck
    vanTruckType: string;

    // Checklists
    truckInspection: ChecklistItem[];
    trailerInspection: ChecklistItem[];
    miscEquipment: ChecklistItem[];

    // Equipment Page Tractor (may differ)
    equipmentTractorType: string;
    equipmentNumTractors: number;
    equipmentPipeLengths: string[];

    // Completion
    completedById: string;
    completedByName: string;
    dateCompleted: string;
    dateSentToErnesto: string;
    dateSentToBobby: string;
    signature: string;

    // Meta
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

// ==================== DEFAULT CHECKLIST ITEMS ====================

export const DEFAULT_TRUCK_INSPECTION: Omit<ChecklistItem, 'id'>[] = [
    { label: 'Vehicle Inspection Sticker Current', checked: false },
    { label: 'Insurance card (binder/glove box)', checked: false },
    { label: 'Registration (binder/glove box)', checked: false },
    { label: 'Re-fuel', checked: false },
    { label: 'Clean inside & out', checked: false },
    { label: 'First Aid Kit', checked: false },
    { label: 'Fire extinguisher', checked: false },
    { label: 'Inspect all tires for defects & tire pressure', checked: false },
    { label: 'Jack and lug wrench', checked: false },
    { label: 'Spare tire', checked: false },
    { label: 'Air gauges (tire pressure)', checked: false },
    { label: 'Change oil & filter and air filter every 5,000 mi.', checked: false },
    { label: 'Change fuel filters every 20,000 mi.', checked: false },
    { label: '12 Volt strobe light', checked: false },
    { label: 'Emergency triangle kit', checked: false },
];

export const DEFAULT_TRAILER_INSPECTION: Omit<ChecklistItem, 'id'>[] = [
    { label: 'Vehicle Inspection Sticker Current', checked: false },
    { label: 'Current License Plate', checked: false },
    { label: 'Registration (binder/glove box)', checked: false },
    { label: 'Break Away Battery Present', checked: false },
    { label: 'Spare tire for trailer', checked: false },
    { label: 'Jack & lug wrench', checked: false },
    { label: 'Slide board on rear of trailer', checked: false },
    { label: 'Chains and ratchets binders', checked: false },
];

export const DEFAULT_MISC_EQUIPMENT: Omit<ChecklistItem, 'id'>[] = [
    { label: 'Core pullers & rope (75\' length)', checked: false },
    { label: 'New brushes on trailer', checked: false },
    { label: 'Gin pole with sling and shackles', checked: false },
    { label: 'Extension rails with lock pins', checked: false },
    { label: 'Hydraulic oil for Kubota', checked: false },
    { label: 'Fuel filter for Kubota tractor', checked: false },
    { label: 'Fuel cans (2)', checked: false },
    { label: 'Trailer lock (cables for fuel cans)', checked: false },
    { label: 'Tool Box (trailer and hand held)', checked: false },
    { label: 'Ice chest', checked: false },
    { label: 'Flashlight', checked: false },
    { label: 'Tarp (20 x 30)', checked: false },
    { label: 'Bungie cords', checked: false },
    { label: 'Shovel (2 square head)', checked: false },
    { label: 'Broom', checked: false },
    { label: 'Gloves', checked: false },
    { label: '25\' tape measure and measuring wheel', checked: false },
    { label: 'Spray paint and wand', checked: false },
    { label: 'String line', checked: false },
    { label: 'Gorilla tape (2 cases - 3" wide tape)', checked: false },
    { label: 'Hand cleaner (mojo)', checked: false },
    { label: 'Knives/blades (qty 20)', checked: false },
    { label: 'WD40', checked: false },
    { label: 'Chemical to spray on tires', checked: false },
    { label: 'Hard hats - adjustable', checked: false },
    { label: 'Vests (green color)', checked: false },
    { label: 'Backpack blower (if applicable)', checked: false },
    { label: '2 Cycle oil for blower (6 bottles)', checked: false },
];

export const DEFAULT_WAREHOUSES = [
    { id: 'arlington', name: 'Arlington' },
    { id: 'baton_rouge', name: 'Baton Rouge' },
    { id: 'houston', name: 'Houston' },
    { id: 'ok_city', name: 'OK City' },
];

export const DEFAULT_VAN_TRUCK_TYPES = [
    { id: 'penske_26', name: "26' Penske van w/lift gate" },
    { id: 'dry_van_53_lift', name: "53' Dry van with lift gate" },
    { id: 'dry_van_53_no_lift', name: "53' Dry van no lift gate" },
    { id: 'tandem_day', name: 'Tandem axle tractor day cab' },
    { id: 'tandem_sleeper', name: 'Tandem axle tractor sleeper' },
    { id: 'stinger_cord', name: 'Stinger cord for lift gate' },
];

export const DEFAULT_PIPE_LENGTHS = [
    { id: 'pipe_12.5', name: "12.5' - schedule 40 steel" },
    { id: 'pipe_13.6', name: "13.6' - schedule 40 steel" },
    { id: 'pipe_14', name: "14' - schedule 40 steel" },
    { id: 'pipe_12.5_float', name: "12.5' - Floating steel pipe" },
];

export const DEFAULT_OTHER_ITEMS = [
    { id: 'core_pullers', name: 'Core pullers' },
    { id: 'tire_chemical', name: 'Chemical to spray on tires' },
    { id: 'new_brushes', name: 'New brushes on trailer' },
];

export const OIL_SOURCE_OPTIONS = [
    { id: 'tanker_eddie', name: 'Tanker Required (Eddie)' },
    { id: 'ifi_tack_doug_eddie', name: 'IFI tack truck, requires Doug or Eddie' },
    { id: 'contractor_sprays_supplies', name: 'Contractor sprays & supplies oil' },
    { id: 'contractor_supplies_only', name: 'Contractor supplies oil only' },
    { id: 'contractor_supplies_ifi_sprays', name: 'Contractor supplies oil, IFI sprays' },
    { id: 'ifi_sprays_supplies', name: 'IFI sprays & supplies oil' },
];

// ==================== STORAGE KEY ====================

const STORAGE_KEY = 'ifi_preconstruction_checklists';

// ==================== HELPERS ====================

export function formatPCCNumber(date: Date = new Date()): string {
    const existing = getPreConstructionChecklists();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const todaysCount = existing.filter(c =>
        c.formNumber.includes(dateStr)
    ).length;
    return `PCC-${dateStr}-${String(todaysCount + 1).padStart(3, '0')}`;
}

export function createDefaultChecklists(): {
    truck: ChecklistItem[];
    trailer: ChecklistItem[];
    misc: ChecklistItem[];
} {
    return {
        truck: DEFAULT_TRUCK_INSPECTION.map(item => ({
            ...item,
            id: crypto.randomUUID(),
        })),
        trailer: DEFAULT_TRAILER_INSPECTION.map(item => ({
            ...item,
            id: crypto.randomUUID(),
        })),
        misc: DEFAULT_MISC_EQUIPMENT.map(item => ({
            ...item,
            id: crypto.randomUUID(),
        })),
    };
}

export function getEmptyChecklist(): Omit<PreConstructionChecklist, 'id' | 'formNumber' | 'createdAt' | 'updatedAt' | 'createdBy'> {
    const checklists = createDefaultChecklists();
    return {
        projectId: '',
        projectName: '',
        epNumber: '',
        projectTeam: [],
        projectTeamNames: [],
        salesPerson: [],
        salesPersonNames: [],
        contractor: '',
        contractorId: '',
        superintendentId: '',
        superintendentName: '',
        superintendentPhone: '',
        superintendentEmail: '',
        contractorCell: '',
        contractorEmail: '',
        projectManager: '',
        pmPhone: '',
        pmEmail: '',
        subcontractContact: '',
        subcontractPhone: '',
        subcontractEmail: '',
        projectAddress: '',
        specialInstructions: '',
        projectType: '',
        projectTypeOther: '',
        dayTime: false,
        nightTime: false,
        rubberTireNotification: false,
        plansReviewedById: '',
        plansReviewedByName: '',
        submittals: '',
        contractNumber: '',
        estimatedStartDate: '',
        estimatedDuration: '',
        equipmentOnSiteDate: '',
        materials: [],
        cutRollsRequired: false,
        cutRollSize: '',
        cutRollQty: 0,
        extensionBarsRequired: false,
        warehouse: '',
        projectSY: 0,
        surfaceTypes: [
            { type: 'Milled', selected: false, rate: 0.2, gallons: 0, lbs: 0 },
            { type: 'Levelup', selected: false, rate: 0.15, gallons: 0, lbs: 0 },
            { type: 'Seal Coat', selected: false, rate: 0.23, gallons: 0, lbs: 0 },
        ],
        tackCoatTypes: [],
        oilSource: '',
        oilCompany: '',
        oilAddress: '',
        oilBusHrs: '',
        oilPULoad: '',
        oilPOIFI: '',
        oilContact1: '',
        oilContact2: '',
        tractorType: '',
        numTractors: 0,
        trailerUnit: '',
        tractorUnit: '',
        backpackBlowers: false,
        gasBlower4Wheeler: null,
        pipeLengths: [],
        otherItems: [],
        vanTruckType: '',
        truckInspection: checklists.truck,
        trailerInspection: checklists.trailer,
        miscEquipment: checklists.misc,
        equipmentTractorType: '',
        equipmentNumTractors: 0,
        equipmentPipeLengths: [],
        completedById: '',
        completedByName: '',
        dateCompleted: '',
        dateSentToErnesto: '',
        dateSentToBobby: '',
        signature: '',
        status: 'draft',
    };
}

// ==================== CRUD OPERATIONS ====================

export function getPreConstructionChecklists(): PreConstructionChecklist[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function getPreConstructionChecklistById(id: string): PreConstructionChecklist | null {
    const checklists = getPreConstructionChecklists();
    return checklists.find(c => c.id === id) || null;
}

export function savePreConstructionChecklist(checklist: PreConstructionChecklist): PreConstructionChecklist {
    const checklists = getPreConstructionChecklists();
    const existingIndex = checklists.findIndex(c => c.id === checklist.id);

    if (existingIndex >= 0) {
        checklists[existingIndex] = { ...checklist, updatedAt: new Date().toISOString() };
    } else {
        checklists.push({
            ...checklist,
            id: checklist.id || crypto.randomUUID(),
            formNumber: checklist.formNumber || formatPCCNumber(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
    return existingIndex >= 0 ? checklists[existingIndex] : checklists[checklists.length - 1];
}

export function deletePreConstructionChecklist(id: string): boolean {
    const checklists = getPreConstructionChecklists();
    const filtered = checklists.filter(c => c.id !== id);
    if (filtered.length === checklists.length) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

export function duplicateChecklist(id: string): PreConstructionChecklist | null {
    const original = getPreConstructionChecklistById(id);
    if (!original) return null;

    const duplicate: PreConstructionChecklist = {
        ...original,
        id: crypto.randomUUID(),
        formNumber: formatPCCNumber(),
        status: 'draft',
        signature: '',
        completedById: '',
        completedByName: '',
        dateCompleted: '',
        dateSentToErnesto: '',
        dateSentToBobby: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return savePreConstructionChecklist(duplicate);
}
