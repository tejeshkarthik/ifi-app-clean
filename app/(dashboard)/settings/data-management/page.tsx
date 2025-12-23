'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { seedGlobalDemoData } from '@/lib/demo-data-seeder';
import { RefreshCw, AlertTriangle, Database, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DataManagementPage() {
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleResetData = () => {
        setIsResetting(true);
        // Seeder handles reload, no need for toast/timeout
        seedGlobalDemoData();
    };

    return (
        <PageWrapper title="Data Management" description="Reset and manage application data">
            <div className="p-6 max-w-3xl">
                {/* Reset Data Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <Database className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800">Reset All Data</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                This will delete all existing data and restore the application to its initial state with sample data.
                                This includes:
                            </p>
                            <ul className="mt-3 text-sm text-slate-600 space-y-1">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    Complete set of Employees, Companies, and Materials
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    Active and Draft Projects with personnel assignments
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    Sample Timesheets requiring approval
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    configured Approval Workflows
                                </li>
                            </ul>

                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    <strong>Warning:</strong> This action cannot be undone. All your current data will be permanently deleted.
                                </p>
                            </div>

                            <Button
                                variant="destructive"
                                onClick={() => setIsResetDialogOpen(true)}
                                className="mt-4"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Reset All Data
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <RefreshCw className="h-6 w-6 text-blue-600" />
                        <div>
                            <h3 className="font-medium text-blue-800">About Sample Data</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Sample data includes a fully interconnected environment for UAT:
                                Active Projects, Employees with roles, Workflow configurations,
                                and pending assignments to test end-to-end flows.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Dialog */}
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Reset All Data?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all your data and restore the application
                            with sample data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetData}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Yes, Reset All Data'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper >
    );
}
