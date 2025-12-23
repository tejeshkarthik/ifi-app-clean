'use client';

import { CompanyList } from '@/components/company-list';

export default function InspectorsPage() {
    return (
        <CompanyList
            type="inspectors"
            title="Inspectors"
            description="Manage inspector companies"
            entityName="Company"
        />
    );
}
