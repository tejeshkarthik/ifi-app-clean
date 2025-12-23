'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getLookupValues,
    addLookupValue,
    updateLookupValue,
    deleteLookupValue,
    toggleLookupValueStatus,
    type LookupCategoryId,
    type LookupValue,
} from '@/lib/lookup-storage';
import {
    Plus, Pencil, Trash2, Settings, X,
    Droplet, Fuel, Gauge, Layers, BarChart3, Ruler,
    Users, Briefcase, Truck, FolderKanban, FileCheck, Clock,
    MapPin, AlertCircle, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'asphalt_mix_types': Layers,
    'oil_types': Droplet,
    'oil_grades': Gauge,
    'tack_coat_types': Fuel,
    'high_grade_types': BarChart3,
    'uom_types': Ruler,
    'employee_classes': Users,
    'employee_crafts': Briefcase,
    'equipment_categories': Truck,
    'project_status_types': FolderKanban,
    'contract_status_types': FileCheck,
    'shift_types': Clock,
    'warehouse_locations': MapPin,
    'lane_types': Layers,
    'surface_types': Layers,
    'van_truck_types': Truck,
    'pipe_length_options': Ruler,
    'issue_types': AlertCircle,
    'standby_reasons': Clock,
};

interface LookupConfig {
    category: LookupCategoryId;
    label: string;
}

interface ConfigurePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    lookups: LookupConfig[];
}

export function ConfigurePanel({ isOpen, onClose, title, description, lookups }: ConfigurePanelProps) {
    const [activeTab, setActiveTab] = useState(lookups[0]?.category || '');
    const [values, setValues] = useState<Record<string, LookupValue[]>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingValue, setEditingValue] = useState<LookupValue | null>(null);
    const [deletingValue, setDeletingValue] = useState<LookupValue | null>(null);
    const [formName, setFormName] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);

    // Load values when panel opens
    useEffect(() => {
        if (isOpen && lookups.length > 0) {
            loadValues(lookups[0].category);
            setActiveTab(lookups[0].category);
        }
    }, [isOpen, lookups]);

    const loadValues = (category: LookupCategoryId) => {
        const vals = getLookupValues(category);
        setValues(prev => ({ ...prev, [category]: vals }));
    };

    const handleTabChange = (tab: LookupCategoryId) => {
        setActiveTab(tab);
        loadValues(tab);
    };

    const openAddModal = () => {
        setEditingValue(null);
        setFormName('');
        setFormIsActive(true);
        setIsModalOpen(true);
    };

    const openEditModal = (value: LookupValue) => {
        setEditingValue(value);
        setFormName(value.name);
        setFormIsActive(value.isActive);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formName.trim()) return;

        if (editingValue) {
            updateLookupValue(activeTab as LookupCategoryId, editingValue.id, {
                name: formName.trim(),
                isActive: formIsActive,
            });
        } else {
            addLookupValue(activeTab as LookupCategoryId, formName.trim(), formIsActive);
        }

        loadValues(activeTab as LookupCategoryId);
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (!deletingValue) return;
        deleteLookupValue(activeTab as LookupCategoryId, deletingValue.id);
        loadValues(activeTab as LookupCategoryId);
        setIsDeleteDialogOpen(false);
        setDeletingValue(null);
    };

    const handleToggleStatus = (value: LookupValue) => {
        toggleLookupValueStatus(activeTab as LookupCategoryId, value.id);
        loadValues(activeTab as LookupCategoryId);
    };

    const currentValues = values[activeTab] || [];
    const currentLabel = lookups.find(l => l.category === activeTab)?.label || '';
    const CurrentIcon = CATEGORY_ICONS[activeTab] || Package;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent
                    className="w-[600px] sm:max-w-[600px] p-0 flex flex-col"
                    side="right"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Settings className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                                {description && (
                                    <p className="text-sm text-slate-500">{description}</p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full hover:bg-slate-100"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content with vertical tabs */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Vertical Tab List */}
                        <div className="w-48 border-r border-slate-200 bg-slate-50/50 overflow-y-auto py-2">
                            {lookups.map(lookup => {
                                const Icon = CATEGORY_ICONS[lookup.category] || Package;
                                const isActive = activeTab === lookup.category;
                                return (
                                    <button
                                        key={lookup.category}
                                        onClick={() => handleTabChange(lookup.category)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-all duration-150',
                                            'hover:bg-white hover:shadow-sm',
                                            isActive
                                                ? 'bg-white text-blue-600 shadow-sm border-r-2 border-blue-600'
                                                : 'text-slate-600'
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-slate-400')} />
                                        <span className="truncate">{lookup.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <CurrentIcon className="h-5 w-5 text-slate-400" />
                                    <h3 className="font-semibold text-slate-800">{currentLabel}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {currentValues.length} items
                                    </Badge>
                                </div>
                                <Button size="sm" onClick={openAddModal} className="shadow-sm">
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Add New
                                </Button>
                            </div>

                            {currentValues.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 shadow-inner">
                                        <CurrentIcon className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h4 className="font-medium text-slate-700 mb-1">No {currentLabel.toLowerCase()} yet</h4>
                                    <p className="text-sm text-slate-500 mb-4 max-w-[200px]">
                                        Add your first value to start using this category
                                    </p>
                                    <Button size="sm" onClick={openAddModal} variant="outline">
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Add your first value
                                    </Button>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/80">
                                                <TableHead className="font-semibold">Name</TableHead>
                                                <TableHead className="w-24 font-semibold">Status</TableHead>
                                                <TableHead className="w-20 text-right font-semibold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentValues.map(value => (
                                                <TableRow key={value.id} className="group hover:bg-slate-50/50">
                                                    <TableCell className="font-medium text-slate-800">{value.name}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={cn(
                                                                'text-xs cursor-pointer transition-colors',
                                                                value.isActive
                                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                            )}
                                                            onClick={() => handleToggleStatus(value)}
                                                        >
                                                            {value.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditModal(value)}
                                                                className="h-7 w-7 p-0 hover:bg-slate-100"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setDeletingValue(value);
                                                                    setIsDeleteDialogOpen(true);
                                                                }}
                                                                className="h-7 w-7 p-0 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CurrentIcon className="h-5 w-5 text-blue-600" />
                            {editingValue ? 'Edit' : 'Add'} {currentLabel}
                        </DialogTitle>
                        <DialogDescription>
                            {editingValue ? 'Update this value' : 'Add a new value to this category'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="valueName">Name *</Label>
                            <Input
                                id="valueName"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Enter name"
                                className="focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <Label className="text-sm font-medium">Active</Label>
                                <p className="text-xs text-slate-500">Available for selection in forms</p>
                            </div>
                            <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!formName.trim()} className="shadow-sm">
                            {editingValue ? 'Save Changes' : 'Add Value'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Value</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingValue?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// Button to trigger the panel
interface ConfigureButtonProps {
    onClick: () => void;
}

export function ConfigureButton({ onClick }: ConfigureButtonProps) {
    return (
        <Button variant="outline" size="sm" onClick={onClick} className="shadow-sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
        </Button>
    );
}
