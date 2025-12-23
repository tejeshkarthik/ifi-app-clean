'use client';

import { useAuth } from '@/lib/auth-context';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    title: string;
}

export function Header({ title }: HeaderProps) {
    const { user, logout } = useAuth();

    const roleColors = {
        admin: 'bg-purple-100 text-purple-700',
        pm: 'bg-blue-100 text-blue-700',
        supervisor: 'bg-green-100 text-green-700',
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
            {/* Left side - Page title */}
            <div className="flex items-center gap-4">
                {/* Spacer for mobile menu button */}
                <div className="lg:hidden w-10" />
                <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            </div>

            {/* Right side - User info and logout */}
            <div className="flex items-center gap-4">
                {user && (
                    <>
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-slate-600" />
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-slate-700">{user.name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                            </div>
                            <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${roleColors[user.role]
                                    }`}
                            >
                                {user.role}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}
