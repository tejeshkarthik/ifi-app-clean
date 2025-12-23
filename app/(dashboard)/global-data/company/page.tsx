'use client';

import { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
    getCompanyProfile,
    saveCompanyProfile,
    addCompanyPOC,
    updateCompanyPOC,
    deleteCompanyPOC,
    type CompanyProfile,
} from '@/lib/company-profile-storage';
import { type POC } from '@/lib/company-storage';
import {
    Building2, Upload, X, Plus, Pencil, Trash2, Phone, Mail, Save, Check, Globe, Linkedin
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CompanyPage() {
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [logo, setLogo] = useState<string | null>(null);
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');

    // POC modals
    const [isPOCModalOpen, setIsPOCModalOpen] = useState(false);
    const [isDeletePOCDialogOpen, setIsDeletePOCDialogOpen] = useState(false);
    const [editingPOC, setEditingPOC] = useState<POC | null>(null);
    const [deletingPOC, setDeletingPOC] = useState<POC | null>(null);
    const [pocForm, setPocForm] = useState({
        name: '',
        title: '',
        phone: '',
        secondaryPhone: '',
        email: '',
        linkedInUrl: '',
        notes: '',
        isActive: true,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const data = getCompanyProfile();
        setCompany(data);
        setName(data.name);
        setLogo(data.logo);
        setAddress(data.address);
        setCity(data.city);
        setState(data.state);
        setZip(data.zip);
        setPhone(data.phone);
        setEmail(data.email || '');
        setWebsite(data.website || '');
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        setLogo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = () => {
        setIsSaving(true);

        const updated = saveCompanyProfile({
            name,
            logo,
            address,
            city,
            state,
            zip,
            phone,
            email,
            website,
        });

        setCompany(updated);
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    };

    const refreshCompany = () => {
        const data = getCompanyProfile();
        setCompany(data);
    };

    // POC handlers
    const openAddPOCModal = () => {
        setEditingPOC(null);
        setPocForm({ name: '', title: '', phone: '', secondaryPhone: '', email: '', linkedInUrl: '', notes: '', isActive: true });
        setIsPOCModalOpen(true);
    };

    const openEditPOCModal = (poc: POC) => {
        setEditingPOC(poc);
        setPocForm({
            name: poc.name,
            title: poc.title,
            phone: poc.phone,
            secondaryPhone: poc.secondaryPhone || '',
            email: poc.email,
            linkedInUrl: poc.linkedInUrl || '',
            notes: poc.notes || '',
            isActive: poc.isActive,
        });
        setIsPOCModalOpen(true);
    };

    const handleSavePOC = () => {
        if (!pocForm.name.trim()) return;

        if (editingPOC) {
            updateCompanyPOC(editingPOC.id, pocForm);
        } else {
            addCompanyPOC(pocForm);
        }

        refreshCompany();
        setIsPOCModalOpen(false);
    };

    const handleDeletePOC = () => {
        if (!deletingPOC) return;
        deleteCompanyPOC(deletingPOC.id);
        refreshCompany();
        setIsDeletePOCDialogOpen(false);
        setDeletingPOC(null);
    };

    if (!company) {
        return (
            <PageWrapper title="Company Profile" description="Loading...">
                <div className="p-6">Loading...</div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Company Profile" description="Manage your company information">
            <div className="p-6 max-w-4xl">
                {/* Company Info Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-6 mb-6">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                {logo ? (
                                    <div className="relative w-32 h-32 rounded-xl border border-slate-200 overflow-hidden bg-white">
                                        <img src={logo} alt="Company logo" className="w-full h-full object-contain" />
                                        <button
                                            onClick={removeLogo}
                                            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50">
                                        <Building2 className="h-10 w-10 text-slate-400 mb-2" />
                                        <span className="text-xs text-slate-500">No Logo</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full mt-2"
                            >
                                <Upload className="h-4 w-4 mr-1" />
                                {logo ? 'Change' : 'Upload'}
                            </Button>
                        </div>

                        {/* Company Name */}
                        <div className="flex-1">
                            <Label htmlFor="companyName" className="text-base font-semibold">Company Name</Label>
                            <Input
                                id="companyName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Industrial Fabrics Inc."
                                className="mt-2 text-lg"
                            />
                        </div>
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Street Address</Label>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="123 Main Street"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Houston"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    placeholder="TX"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">ZIP</Label>
                                <Input
                                    id="zip"
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    placeholder="77001"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="(713) 555-1234"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="info@company.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.company.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {saveSuccess ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Company Info
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* POCs Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Points of Contact</h2>
                            <p className="text-sm text-slate-500">Company representatives</p>
                        </div>
                        <Button size="sm" onClick={openAddPOCModal}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add POC
                        </Button>
                    </div>

                    {company.pocs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p className="mb-3">No points of contact added yet.</p>
                            <Button variant="outline" size="sm" onClick={openAddPOCModal}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add POC
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {company.pocs.map((poc) => (
                                    <TableRow key={poc.id}>
                                        <TableCell className="font-medium">{poc.name}</TableCell>
                                        <TableCell className="text-slate-600">{poc.title || '-'}</TableCell>
                                        <TableCell>
                                            {poc.phone && (
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <Phone className="h-3 w-3" />
                                                    {poc.phone}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {poc.email && (
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <Mail className="h-3 w-3" />
                                                    {poc.email}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {poc.isActive ? (
                                                <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditPOCModal(poc)}
                                                    className="h-7 w-7 p-0"
                                                >
                                                    <Pencil className="h-3 w-3 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingPOC(poc);
                                                        setIsDeletePOCDialogOpen(true);
                                                    }}
                                                    className="h-7 w-7 p-0 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Add/Edit POC Modal */}
            <Dialog open={isPOCModalOpen} onOpenChange={setIsPOCModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPOC ? 'Edit POC' : 'Add POC'}</DialogTitle>
                        <DialogDescription>
                            {editingPOC ? 'Update point of contact' : 'Add a new point of contact'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="poc-name">Name *</Label>
                                <Input
                                    id="poc-name"
                                    value={pocForm.name}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc-title">Title</Label>
                                <Input
                                    id="poc-title"
                                    value={pocForm.title}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Job title"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="poc-phone">Phone</Label>
                                <Input
                                    id="poc-phone"
                                    value={pocForm.phone}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc-secondary-phone">Secondary Phone</Label>
                                <Input
                                    id="poc-secondary-phone"
                                    value={pocForm.secondaryPhone}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, secondaryPhone: e.target.value }))}
                                    placeholder="(555) 987-6543"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="poc-email">Email</Label>
                                <Input
                                    id="poc-email"
                                    type="email"
                                    value={pocForm.email}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@company.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poc-linkedin">LinkedIn URL</Label>
                                <Input
                                    id="poc-linkedin"
                                    value={pocForm.linkedInUrl}
                                    onChange={(e) => setPocForm(prev => ({ ...prev, linkedInUrl: e.target.value }))}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="poc-notes">Notes</Label>
                            <Textarea
                                id="poc-notes"
                                value={pocForm.notes}
                                onChange={(e) => setPocForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes about this contact..."
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <Label htmlFor="poc-status">Active</Label>
                                <p className="text-sm text-slate-500">Available for selection</p>
                            </div>
                            <Switch
                                id="poc-status"
                                checked={pocForm.isActive}
                                onCheckedChange={(checked) => setPocForm(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPOCModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePOC} disabled={!pocForm.name.trim()}>
                            {editingPOC ? 'Save Changes' : 'Add POC'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete POC Confirmation */}
            <AlertDialog open={isDeletePOCDialogOpen} onOpenChange={setIsDeletePOCDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete POC</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingPOC?.name}&quot;?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePOC} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageWrapper>
    );
}
