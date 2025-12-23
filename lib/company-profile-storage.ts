// Company profile storage (single record for IFI)

import { type POC } from './company-storage';

export interface CompanyProfile {
    name: string;
    logo: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    website: string;
    pocs: POC[];
    updatedAt: string;
}

const STORAGE_KEY = 'ifi_company';

const DEFAULT_COMPANY: CompanyProfile = {
    name: '',
    logo: null,
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    pocs: [],
    updatedAt: new Date().toISOString(),
};

// Get company profile
export function getCompanyProfile(): CompanyProfile {
    if (typeof window === 'undefined') return DEFAULT_COMPANY;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_COMPANY;

    try {
        return { ...DEFAULT_COMPANY, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_COMPANY;
    }
}

// Save company profile
export function saveCompanyProfile(data: Partial<Omit<CompanyProfile, 'updatedAt'>>): CompanyProfile {
    const current = getCompanyProfile();
    const updated: CompanyProfile = {
        ...current,
        ...data,
        updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

// Add POC to company
export function addCompanyPOC(data: Omit<POC, 'id'>): POC {
    const company = getCompanyProfile();
    const newPOC: POC = {
        ...data,
        id: crypto.randomUUID(),
    };

    company.pocs.push(newPOC);
    saveCompanyProfile({ pocs: company.pocs });
    return newPOC;
}

// Update POC
export function updateCompanyPOC(pocId: string, data: Partial<Omit<POC, 'id'>>): POC | null {
    const company = getCompanyProfile();
    const index = company.pocs.findIndex(p => p.id === pocId);

    if (index === -1) return null;

    company.pocs[index] = { ...company.pocs[index], ...data };
    saveCompanyProfile({ pocs: company.pocs });
    return company.pocs[index];
}

// Delete POC
export function deleteCompanyPOC(pocId: string): boolean {
    const company = getCompanyProfile();
    const index = company.pocs.findIndex(p => p.id === pocId);

    if (index === -1) return false;

    company.pocs.splice(index, 1);
    saveCompanyProfile({ pocs: company.pocs });
    return true;
}
