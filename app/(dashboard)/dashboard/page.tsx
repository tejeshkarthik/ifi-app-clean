'use client';

import { PageWrapper } from '@/components/page-wrapper';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function DashboardPage() {
    const { user, logout } = useAuth();

    const roleColors = {
        admin: 'bg-purple-100 text-purple-700 border-purple-200',
        pm: 'bg-blue-100 text-blue-700 border-blue-200',
        supervisor: 'bg-green-100 text-green-700 border-green-200',
    };

    return (
        <PageWrapper title="Dashboard" description="Welcome to IFI Field App">
            <div className="p-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name}!</h2>
                            <p className="text-blue-100">You're logged in as {user?.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className={`px-3 py-1.5 text-sm font-medium rounded-full border capitalize ${user?.role ? roleColors[user.role] : ''
                                    }`}
                            >
                                {user?.role}
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={logout}
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Active Projects</p>
                        <p className="text-2xl font-bold text-slate-800">0</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Pending Approvals</p>
                        <p className="text-2xl font-bold text-slate-800">0</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Forms Today</p>
                        <p className="text-2xl font-bold text-slate-800">0</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Open Issues</p>
                        <p className="text-2xl font-bold text-slate-800">0</p>
                    </div>
                </div>

                {/* Info message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                        <strong>Note:</strong> This is a development version. Configure your data in the{' '}
                        <span className="font-medium">Settings → Lookup Tables</span> section to get started.
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
}
