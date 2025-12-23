'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/sidebar';
import { initializeSampleData } from '@/lib/sample-data';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();

    // Initialize sample data on first load
    useEffect(() => {
        initializeSampleData();
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-600">Loading...</span>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <Sidebar />
            <main className="flex-1 flex flex-col min-h-screen lg:ml-0">
                {children}
            </main>
        </div>
    );
}
