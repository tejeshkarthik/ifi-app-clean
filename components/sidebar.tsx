'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Home,
    Building2,
    Users,
    Truck,
    ClipboardCheck,
    Package,
    Wrench,
    FolderKanban,
    Clock,
    AlertCircle,
    Boxes,
    ShieldCheck,
    FileCheck,
    FileText,
    Settings,
    GitBranch,
    Shield,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getEmployeesWithAppAccess, setCurrentUserEmail } from '@/lib/employee-storage';
import { getWorkflows } from '@/lib/workflow-storage';
import { getTimesheets } from '@/lib/timesheet-storage';
import { getMaterialUsageLogs } from '@/lib/forms-storage';

interface NavItem {
    title: string;
    href?: string;
    icon: React.ElementType;
    children?: NavItem[];
    moduleKey?: string; // Used for permission checking
    parentKey?: string; // Parent module for checking children
}

// Full navigation structure
const fullNavigation: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        moduleKey: 'dashboard',
    },
    {
        title: 'Global Data',
        icon: Building2,
        moduleKey: 'globalData',
        children: [
            { title: 'Company', href: '/global-data/company', icon: Building2, moduleKey: 'company', parentKey: 'globalData' },
            { title: 'Owners', href: '/global-data/owners', icon: Users, moduleKey: 'owners', parentKey: 'globalData' },
            { title: 'Contractors', href: '/global-data/contractors', icon: Truck, moduleKey: 'contractors', parentKey: 'globalData' },
            { title: 'Inspectors', href: '/global-data/inspectors', icon: ClipboardCheck, moduleKey: 'inspectors', parentKey: 'globalData' },
            { title: 'Employees', href: '/global-data/employees', icon: Users, moduleKey: 'employees', parentKey: 'globalData' },
            { title: 'Materials', href: '/global-data/materials', icon: Package, moduleKey: 'materials', parentKey: 'globalData' },
            { title: 'Equipment', href: '/global-data/equipment', icon: Wrench, moduleKey: 'equipment', parentKey: 'globalData' },
        ],
    },
    {
        title: 'Projects',
        href: '/projects',
        icon: FolderKanban,
        moduleKey: 'projects',
    },
    {
        title: 'Contact Directory',
        href: '/contact-directory',
        icon: Users,
        moduleKey: 'contactDirectory',
    },
    {
        title: 'Field Forms',
        icon: FileCheck,
        moduleKey: 'fieldForms',
        children: [
            { title: 'Timesheet', href: '/forms/timesheet', icon: Clock, moduleKey: 'timesheet', parentKey: 'fieldForms' },
            { title: 'Daily Field Report', href: '/forms/material-usage', icon: Boxes, moduleKey: 'dailyFieldReport', parentKey: 'fieldForms' },
            { title: 'Issues Log', href: '/forms/issues', icon: AlertCircle, moduleKey: 'issuesLog', parentKey: 'fieldForms' },
            { title: 'Safety (JHA)', href: '/forms/safety', icon: ShieldCheck, moduleKey: 'safetyJha', parentKey: 'fieldForms' },
            { title: 'Pre-Construction', href: '/forms/pre-construction', icon: FileCheck, moduleKey: 'preConstruction', parentKey: 'fieldForms' },
        ],
    },
    {
        title: 'Bill of Lading',
        href: '/bill-of-lading',
        icon: FileText,
        moduleKey: 'billOfLading',
    },
    {
        title: 'Settings',
        icon: Settings,
        moduleKey: 'settings',
        children: [
            { title: 'Approval Workflows', href: '/settings/workflows', icon: GitBranch, moduleKey: 'approvalWorkflows', parentKey: 'settings' },
            { title: 'Role Configuration', href: '/settings/role-configuration', icon: Shield, moduleKey: 'roleConfiguration', parentKey: 'settings' },
            { title: 'Data Management', href: '/settings/data-management', icon: Settings, moduleKey: 'dataManagement', parentKey: 'settings' },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<string[]>(['globalData', 'fieldForms', 'settings']);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    // Get permissions from hook
    const { canView, currentUser } = usePermissions();

    useEffect(() => {
        // Load users for the switcher
        setAvailableUsers(getEmployeesWithAppAccess());

        // Initial load of counts
        updateCounts();

        // Listen for storage changes to update badges
        const handleStorageChange = () => updateCounts();
        window.addEventListener('storage', handleStorageChange);

        // Also update when location changes (user might have approved something)
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentUser]); // Re-run when user changes

    // Update counts when pathname changes too
    useEffect(() => {
        updateCounts();
    }, [pathname]);

    const updateCounts = () => {
        if (!currentUser) return;

        const workflows = getWorkflows();

        // Timesheets
        const timesheetWorkflow = workflows.find(w => w.isActive && w.assignedForms.includes('timesheet'));
        let timesheetCount = 0;

        if (timesheetWorkflow) {
            const pendingTimesheets = getTimesheets().filter(t => t.status === 'Pending Approval');
            timesheetCount = pendingTimesheets.filter(t => {
                const currentLevelNum = t.approvalLevel || 1;
                const level = timesheetWorkflow.levels.find(l => l.levelNumber === currentLevelNum);
                if (!level) return false;

                return level.approverIds.some(id =>
                    id.toLowerCase() === currentUser.role?.toLowerCase() ||
                    id === currentUser.id ||
                    (currentUser.role === 'super-admin' && id === 'Admin')
                );
            }).length;
        }

        // Daily Field Reports
        const reportWorkflow = workflows.find(w => w.isActive && w.assignedForms.includes('material_usage'));
        let reportCount = 0;

        if (reportWorkflow) {
            const pendingReports = getMaterialUsageLogs().filter(l => l.status === 'pending');
            reportCount = pendingReports.filter(l => {
                const currentLevelNum = l.approvalLevel || 1;
                const level = reportWorkflow.levels.find(lvl => lvl.levelNumber === currentLevelNum);
                if (!level) return false;

                return level.approverIds.some(id =>
                    id.toLowerCase() === currentUser.role?.toLowerCase() ||
                    id === currentUser.id ||
                    (currentUser.role === 'super-admin' && id === 'Admin')
                );
            }).length;
        }

        setCounts({ timesheet: timesheetCount, dailyFieldReport: reportCount });
    };

    const [counts, setCounts] = useState({ timesheet: 0, dailyFieldReport: 0 });

    const toggleMenu = (title: string) => {
        setOpenMenus(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    // Filter navigation based on permissions
    const navigation = useMemo(() => {
        return fullNavigation
            .map(item => {
                // check if main item is visible
                const isItemVisible = item.moduleKey ? canView(item.moduleKey) : true;

                if (!isItemVisible) return null;

                // For items with children (dropdowns)
                if (item.children) {
                    // Filter children based on their permissions
                    const validChildren = item.children.filter(child => {
                        // Special case for Data Management (always visible if settings is visible for now, or add specific perm)
                        if (child.title === 'Data Management') return true;

                        // If child has specific module key, check it
                        if (child.moduleKey) {
                            // If it has a parent key, check permission as child of parent
                            if (child.parentKey) {
                                return canView(child.parentKey, child.moduleKey);
                            }
                            // Otherwise check as top level module
                            return canView(child.moduleKey);
                        }

                        return true;
                    });

                    // If no children are visible, hide the parent
                    if (validChildren.length === 0) return null;

                    return { ...item, children: validChildren };
                }

                return item;
            })
            .filter(Boolean) as NavItem[];
    }, [canView]);

    const NavContent = () => (
        <div className="flex flex-col h-full bg-[#f8f9fa] text-slate-700 w-64">
            <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xl">I</span>
                    </div>
                    <div>
                        <h1 className="text-slate-900 font-bold text-lg leading-none">Ind Fab</h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Field Application</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navigation.map((item) => {
                    const isActive = item.href ? pathname === item.href : false;
                    const isMenuOpen = openMenus.includes(item.moduleKey || item.title);
                    const hasActiveChild = item.children?.some(child => child.href === pathname);

                    if (item.children) {
                        return (
                            <div key={item.title} className="mb-1">
                                <button
                                    onClick={() => toggleMenu(item.moduleKey || item.title)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium",
                                        hasActiveChild || isMenuOpen
                                            ? "text-blue-700 bg-blue-50/80"
                                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <item.icon className={cn(
                                            "w-4.5 h-4.5 transition-colors",
                                            hasActiveChild || isMenuOpen ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                        )} />
                                        {item.title}
                                    </div>
                                    {isMenuOpen ? (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                </button>

                                {isMenuOpen && (
                                    <div className="mt-0.5 ml-4 space-y-0 border-l-2 border-slate-100 pl-2.5">
                                        {item.children.map((child) => {
                                            const isChildActive = pathname === child.href;
                                            return (
                                                <Link
                                                    key={child.title}
                                                    href={child.href!}
                                                    onClick={() => setIsMobileOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                                                        isChildActive
                                                            ? "text-blue-700 bg-blue-50 font-medium border-r-2 border-blue-600 rounded-r-none"
                                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                                    )}
                                                >
                                                    <child.icon className={cn("w-4 h-4", isChildActive ? "text-blue-500" : "text-slate-400")} />

                                                    {child.title}
                                                    {/* Badge */}
                                                    {child.moduleKey && (counts as any)[child.moduleKey] > 0 && (
                                                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                            {(counts as any)[child.moduleKey]}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.title}
                            href={item.href!}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium mb-0.5",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn("w-4.5 h-4.5", isActive ? "text-blue-100" : "text-slate-400")} />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold ring-2 ring-white shadow-sm">
                            {currentUser?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name || 'User'}</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <p className="text-xs text-slate-500 truncate font-medium">{currentUser?.role || 'No Role'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Role Switcher for Testing */}
                    <div className="px-2 pt-3 border-t border-slate-100">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">Test Mode: Switch Role</label>
                        <select
                            className="w-full bg-slate-50 text-xs text-slate-700 rounded-md border border-slate-200 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer hover:border-slate-300"
                            value={currentUser?.email || ''}
                            onChange={(e) => {
                                const email = e.target.value;
                                if (email) {
                                    setCurrentUserEmail(email);
                                    window.location.reload();
                                }
                            }}
                        >
                            <option value="">Select User...</option>
                            {availableUsers.map(u => (
                                <option key={u.id} value={u.email}>
                                    {u.name} ({u.role})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar - Static position for standard layout flow */}
            <aside className="hidden lg:block w-64 bg-[#f8f9fa] border-r border-slate-200 shrink-0 h-screen sticky top-0 overflow-hidden z-40">
                <NavContent />
            </aside>

            {/* Mobile Sidebar - Sheet/Drawer */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-slate-200 w-64 bg-[#f8f9fa]">
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
