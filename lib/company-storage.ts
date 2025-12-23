// Generic company storage for Owners, Contractors, Inspectors

export interface POC {
    id: string;
    name: string;
    title: string;
    phone: string;
    secondaryPhone: string;
    email: string;
    linkedInUrl: string;
    notes: string;
    isActive: boolean;
}

export interface Company {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    website: string;
    isActive: boolean;
    pocs: POC[];
    createdAt: string;
    updatedAt: string;
}

export type CompanyType = 'owners' | 'contractors' | 'inspectors';

const STORAGE_KEYS: Record<CompanyType, string> = {
    owners: 'ifi_owners',
    contractors: 'ifi_contractors',
    inspectors: 'ifi_inspectors',
};

// Get all companies of a type
export function getCompanies(type: CompanyType): Company[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEYS[type]);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get active companies only
export function getActiveCompanies(type: CompanyType): Company[] {
    return getCompanies(type).filter(c => c.isActive);
}

// Get company by ID
export function getCompanyById(type: CompanyType, id: string): Company | null {
    return getCompanies(type).find(c => c.id === id) || null;
}

// Add new company
export function addCompany(type: CompanyType, data: Omit<Company, 'id' | 'pocs' | 'createdAt' | 'updatedAt'>): Company {
    const companies = getCompanies(type);

    const newCompany: Company = {
        ...data,
        id: crypto.randomUUID(),
        pocs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    companies.push(newCompany);
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(companies));
    return newCompany;
}

// Update company
export function updateCompany(type: CompanyType, id: string, data: Partial<Omit<Company, 'id' | 'pocs' | 'createdAt' | 'updatedAt'>>): Company | null {
    const companies = getCompanies(type);
    const index = companies.findIndex(c => c.id === id);

    if (index === -1) return null;

    companies[index] = {
        ...companies[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(companies));
    return companies[index];
}

// Delete company
export function deleteCompany(type: CompanyType, id: string): boolean {
    const companies = getCompanies(type);
    const index = companies.findIndex(c => c.id === id);

    if (index === -1) return false;

    companies.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(companies));
    return true;
}

// Add POC to company
export function addPOC(type: CompanyType, companyId: string, data: Omit<POC, 'id'>): POC | null {
    const companies = getCompanies(type);
    const company = companies.find(c => c.id === companyId);

    if (!company) return null;

    const newPOC: POC = {
        ...data,
        id: crypto.randomUUID(),
    };

    company.pocs.push(newPOC);
    company.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(companies));
    return newPOC;
}

// Update POC
export function updatePOC(type: CompanyType, companyId: string, pocId: string, data: Partial<Omit<POC, 'id'>>): POC | null {
    const companies = getCompanies(type);
    const company = companies.find(c => c.id === companyId);

    if (!company) return null;

    const pocIndex = company.pocs.findIndex(p => p.id === pocId);
    if (pocIndex === -1) return null;

    company.pocs[pocIndex] = {
        ...company.pocs[pocIndex],
        ...data,
    };

    company.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(companies));
    return company.pocs[pocIndex];
}

// Delete POC
export function deletePOC(type: CompanyType, companyId: string, pocId: string): boolean {
    const companies = getCompanies(type);
    const company = companies.find(c => c.id === companyId);

    if (!company) return false;

    const pocIndex = company.pocs.findIndex(p => p.id === pocId);
    if (pocIndex === -1) return false;

    company.pocs.splice(pocIndex, 1);
    company.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(companies));
    return true;
}

// Get all active POCs for a company type (for multi-select dropdowns)
export function getActivePOCs(type: CompanyType, companyId: string): POC[] {
    const company = getCompanyById(type, companyId);
    if (!company) return [];
    return company.pocs.filter(p => p.isActive);
}
