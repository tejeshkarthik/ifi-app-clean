'use client';

import { CompanyList } from '@/components/company-list';

export default function OwnersPage() {
    return (
        <CompanyList
            type="owners"
            title="Owners"
            description="Manage project owners (DOT agencies, etc.)"
            entityName="Owner"
        />
    );
}
