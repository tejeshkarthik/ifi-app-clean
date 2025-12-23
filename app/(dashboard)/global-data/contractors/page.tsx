'use client';

import { CompanyList } from '@/components/company-list';

export default function ContractorsPage() {
    return (
        <CompanyList
            type="contractors"
            title="Contractors"
            description="Manage contractor companies"
            entityName="Contractor"
        />
    );
}
