'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getProjectById,
    addProject,
    updateProject,
    getDefaultProject,
    type Project,
    type ProjectMaterial,
    type ProjectEquipmentOwned,
    type ProjectEquipmentThirdParty,
} from '@/lib/project-storage';
import { getActiveLookupValues } from '@/lib/lookup-storage';
import { getEmployees, type Employee } from '@/lib/employee-storage';
import { getActiveCompanies, getCompanyById, type Company, type POC } from '@/lib/company-storage';
import { getActiveMaterials, type Material } from '@/lib/material-storage';
import { getActiveEquipment, type Equipment } from '@/lib/equipment-storage';
import {
    Save, X, Plus, Trash2, Upload, FileText, ArrowLeft,
    Building2, MapPin, Users, Calendar, FileCheck, Package, Droplet, Truck
} from 'lucide-react';
import { MultiSelect } from '@/components/multi-select';

export default function ProjectFormPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;
    const isEditing = projectId && projectId !== 'new';

    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Form data based on Project interface
    const [formData, setFormData] = useState(getDefaultProject());

    // Lookup options
    const [statusOptions, setStatusOptions] = useState<{ id: string; name: string }[]>([]);
    const [contractStatusOptions, setContractStatusOptions] = useState<{ id: string; name: string }[]>([]);
    const [shiftOptions, setShiftOptions] = useState<{ id: string; name: string }[]>([]);
    const [tackCoatOptions, setTackCoatOptions] = useState<{ id: string; name: string }[]>([]);
    const [uomOptions, setUomOptions] = useState<{ id: string; name: string }[]>([]);

    // Entity options
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [owners, setOwners] = useState<Company[]>([]);
    const [contractors, setContractors] = useState<Company[]>([]);
    const [inspectors, setInspectors] = useState<Company[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [ownedEquipmentOptions, setOwnedEquipmentOptions] = useState<Equipment[]>([]);

    // POC options based on selected companies
    const [ownerPocs, setOwnerPocs] = useState<POC[]>([]);
    const [contractorPocs, setContractorPocs] = useState<POC[]>([]);
    const [inspectorPocs, setInspectorPocs] = useState<POC[]>([]);

    const contractDocRef = useRef<HTMLInputElement>(null);
    const signedContractRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadOptions();

        if (isEditing) {
            const project = getProjectById(projectId);
            if (project) {
                setFormData(project);
                // Load POCs for selected companies
                if (project.ownerId) {
                    const owner = getCompanyById('owners', project.ownerId);
                    if (owner) setOwnerPocs(owner.pocs.filter(p => p.isActive));
                }
                if (project.contractorId) {
                    const contractor = getCompanyById('contractors', project.contractorId);
                    if (contractor) setContractorPocs(contractor.pocs.filter(p => p.isActive));
                }
                if (project.inspectorId) {
                    const inspector = getCompanyById('inspectors', project.inspectorId);
                    if (inspector) setInspectorPocs(inspector.pocs.filter(p => p.isActive));
                }
            }
        }
    }, [isEditing, projectId]);

    const loadOptions = () => {
        setStatusOptions(getActiveLookupValues('project_status_types').map(v => ({ id: v.id, name: v.name })));
        setContractStatusOptions(getActiveLookupValues('contract_status_types').map(v => ({ id: v.id, name: v.name })));
        setShiftOptions(getActiveLookupValues('shift_types').map(v => ({ id: v.id, name: v.name })));
        setTackCoatOptions(getActiveLookupValues('tack_coat_types').map(v => ({ id: v.id, name: v.name })));
        setUomOptions(getActiveLookupValues('uom_types').map(v => ({ id: v.id, name: v.name })));

        setEmployees(getEmployees().filter(e => e.isActive));
        setOwners(getActiveCompanies('owners'));
        setContractors(getActiveCompanies('contractors'));
        setInspectors(getActiveCompanies('inspectors'));
        setMaterials(getActiveMaterials());
        setOwnedEquipmentOptions(getActiveEquipment().filter(e => e.ownership === 'Owned'));
    };

    const handleOwnerChange = (ownerId: string) => {
        const owner = getCompanyById('owners', ownerId);
        if (owner) {
            setFormData(prev => ({
                ...prev,
                ownerId,
                ownerName: owner.name,
                ownerAddress: `${owner.address}, ${owner.city}, ${owner.state} ${owner.zip}`.trim().replace(/^,\s*/, ''),
                ownerPocIds: [],
            }));
            setOwnerPocs(owner.pocs.filter(p => p.isActive));
        }
    };

    const handleContractorChange = (contractorId: string) => {
        const contractor = getCompanyById('contractors', contractorId);
        if (contractor) {
            setFormData(prev => ({
                ...prev,
                contractorId,
                contractorName: contractor.name,
                contractorAddress: `${contractor.address}, ${contractor.city}, ${contractor.state} ${contractor.zip}`.trim().replace(/^,\s*/, ''),
                contractorPocIds: [],
            }));
            setContractorPocs(contractor.pocs.filter(p => p.isActive));
        }
    };

    const handleInspectorChange = (inspectorId: string) => {
        const inspector = getCompanyById('inspectors', inspectorId);
        if (inspector) {
            setFormData(prev => ({
                ...prev,
                inspectorId,
                inspectorName: inspector.name,
                inspectorAddress: `${inspector.address}, ${inspector.city}, ${inspector.state} ${inspector.zip}`.trim().replace(/^,\s*/, ''),
                inspectorPocIds: [],
            }));
            setInspectorPocs(inspector.pocs.filter(p => p.isActive));
        }
    };

    const handleFileUpload = (field: 'contractDocument' | 'signedContract') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    // Material handlers
    const addMaterialRow = () => {
        const newMaterial: ProjectMaterial = {
            id: crypto.randomUUID(),
            materialId: '',
            materialCode: '',
            description: '',
            totalEstimatedQty: null,
            uom: '',
            totalEstimatedRolls: null,
        };
        setFormData(prev => ({ ...prev, materials: [...prev.materials, newMaterial] }));
    };

    const updateMaterial = (index: number, materialId: string) => {
        const material = materials.find(m => m.id === materialId);
        if (material) {
            const updated = [...formData.materials];
            updated[index] = {
                ...updated[index],
                materialId,
                materialCode: material.code,
                description: material.description,
                uom: material.uomName,
            };
            setFormData(prev => ({ ...prev, materials: updated }));
        }
    };

    const removeMaterial = (index: number) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index),
        }));
    };

    // Owned Equipment handlers
    const addOwnedEquipmentRow = () => {
        const newEquip: ProjectEquipmentOwned = {
            id: crypto.randomUUID(),
            equipmentId: '',
            equipmentCode: '',
            equipmentName: '',
            category: '',
            startDate: '',
            returnDate: '',
        };
        setFormData(prev => ({ ...prev, ownedEquipment: [...prev.ownedEquipment, newEquip] }));
    };

    const updateOwnedEquipment = (index: number, equipmentId: string) => {
        const equip = ownedEquipmentOptions.find(e => e.id === equipmentId);
        if (equip) {
            const updated = [...formData.ownedEquipment];
            updated[index] = {
                ...updated[index],
                equipmentId,
                equipmentCode: equip.code,
                equipmentName: equip.name,
                category: equip.categoryName,
            };
            setFormData(prev => ({ ...prev, ownedEquipment: updated }));
        }
    };

    const removeOwnedEquipment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            ownedEquipment: prev.ownedEquipment.filter((_, i) => i !== index),
        }));
    };

    // Third Party Equipment handlers
    const addThirdPartyEquipmentRow = () => {
        const newEquip: ProjectEquipmentThirdParty = {
            id: crypto.randomUUID(),
            description: '',
            vendor: '',
            poNumber: '',
        };
        setFormData(prev => ({ ...prev, thirdPartyEquipment: [...prev.thirdPartyEquipment, newEquip] }));
    };

    const removeThirdPartyEquipment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            thirdPartyEquipment: prev.thirdPartyEquipment.filter((_, i) => i !== index),
        }));
    };

    const handleSave = (asDraft: boolean) => {
        if (!formData.name.trim() || !formData.epNumber.trim()) {
            setActiveTab('profile');
            return;
        }

        setIsSaving(true);
        const dataToSave = { ...formData, isDraft: asDraft };

        if (isEditing) {
            updateProject(projectId, dataToSave);
        } else {
            addProject(dataToSave);
        }

        setIsSaving(false);
        router.push('/projects');
    };

    const togglePocSelection = (field: 'ownerPocIds' | 'contractorPocIds' | 'inspectorPocIds', pocId: string) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(pocId)
                ? current.filter(id => id !== pocId)
                : [...current, pocId];
            return { ...prev, [field]: updated };
        });
    };

    const toggleEmployeeSelection = (field: 'pmIds' | 'supervisorIds' | 'leadIds' | 'workerIds', empId: string) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(empId)
                ? current.filter(id => id !== empId)
                : [...current, empId];
            return { ...prev, [field]: updated };
        });
    };

    const filterEmployeesByRole = (role: string) => {
        return employees.filter(e => e.role === role);
    };

    return (
        <PageWrapper
            title={isEditing ? 'Edit Project' : 'New Project'}
            description={isEditing ? `Editing ${formData.name || 'project'}` : 'Create a new project'}
        >
            <div className="p-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => router.push('/projects')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push('/projects')}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}>
                            Save as Draft
                        </Button>
                        <Button onClick={() => handleSave(false)} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>

                {/* Tabs Form */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-slate-200 bg-slate-50 px-4">
                            <TabsList className="h-14 bg-transparent gap-1">
                                <TabsTrigger value="profile" className="data-[state=active]:bg-white gap-2">
                                    <Building2 className="h-4 w-4" /> Profile
                                </TabsTrigger>
                                <TabsTrigger value="location" className="data-[state=active]:bg-white gap-2">
                                    <MapPin className="h-4 w-4" /> Location
                                </TabsTrigger>
                                <TabsTrigger value="personnel" className="data-[state=active]:bg-white gap-2">
                                    <Users className="h-4 w-4" /> Personnel
                                </TabsTrigger>
                                <TabsTrigger value="schedule" className="data-[state=active]:bg-white gap-2">
                                    <Calendar className="h-4 w-4" /> Schedule
                                </TabsTrigger>
                                <TabsTrigger value="documents" className="data-[state=active]:bg-white gap-2">
                                    <FileCheck className="h-4 w-4" /> Documents
                                </TabsTrigger>
                                <TabsTrigger value="materials" className="data-[state=active]:bg-white gap-2">
                                    <Package className="h-4 w-4" /> Materials
                                </TabsTrigger>
                                <TabsTrigger value="tackcoat" className="data-[state=active]:bg-white gap-2">
                                    <Droplet className="h-4 w-4" /> Tack Coat
                                </TabsTrigger>
                                <TabsTrigger value="equipment" className="data-[state=active]:bg-white gap-2">
                                    <Truck className="h-4 w-4" /> Equipment
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            {/* SECTION 1: Profile */}
                            <TabsContent value="profile" className="mt-0 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Project Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Highway 290 Overlay"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="epNumber">Engineering Project Number (EP#) *</Label>
                                        <Input
                                            id="epNumber"
                                            value={formData.epNumber}
                                            onChange={(e) => setFormData(prev => ({ ...prev, epNumber: e.target.value }))}
                                            placeholder="EP-2024-001"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Project Status</Label>
                                        <Select
                                            value={formData.statusId}
                                            onValueChange={(v) => {
                                                const opt = statusOptions.find(o => o.id === v);
                                                setFormData(prev => ({ ...prev, statusId: v, statusName: opt?.name || '' }));
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contract Status</Label>
                                        <Select
                                            value={formData.contractStatusId}
                                            onValueChange={(v) => {
                                                const opt = contractStatusOptions.find(o => o.id === v);
                                                setFormData(prev => ({ ...prev, contractStatusId: v, contractStatusName: opt?.name || '' }));
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select contract status" /></SelectTrigger>
                                            <SelectContent>
                                                {contractStatusOptions.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Salesperson</Label>
                                        <Select
                                            value={formData.salespersonId}
                                            onValueChange={(v) => {
                                                const emp = employees.find(e => e.id === v);
                                                setFormData(prev => ({ ...prev, salespersonId: v, salespersonName: emp?.name || '' }));
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select salesperson" /></SelectTrigger>
                                            <SelectContent>
                                                {employees.filter(e => ['PM', 'Supervisor'].includes(e.role)).map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contract Document</Label>
                                        <div className="flex gap-2">
                                            <input type="file" ref={contractDocRef} onChange={handleFileUpload('contractDocument')} className="hidden" />
                                            <Button type="button" variant="outline" onClick={() => contractDocRef.current?.click()}>
                                                <Upload className="h-4 w-4 mr-2" />
                                                {formData.contractDocument ? 'Change File' : 'Upload'}
                                            </Button>
                                            {formData.contractDocument && (
                                                <Badge variant="outline" className="gap-1">
                                                    <FileText className="h-3 w-3" /> Uploaded
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SECTION 2: Location */}
                            <TabsContent value="location" className="mt-0 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="streetAddress">Street Address</Label>
                                    <Input
                                        id="streetAddress"
                                        value={formData.streetAddress}
                                        onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                                        placeholder="123 Highway 290"
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="county">County</Label>
                                        <Input
                                            id="county"
                                            value={formData.county}
                                            onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                                            placeholder="Harris"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                            placeholder="Houston"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                            placeholder="TX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zip">ZIP</Label>
                                        <Input
                                            id="zip"
                                            value={formData.zip}
                                            onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                                            placeholder="77001"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="gpsStart">GPS Start Coordinates</Label>
                                        <Input
                                            id="gpsStart"
                                            value={formData.gpsStart}
                                            onChange={(e) => setFormData(prev => ({ ...prev, gpsStart: e.target.value }))}
                                            placeholder="29.7604,-95.3698"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gpsEnd">GPS End Coordinates</Label>
                                        <Input
                                            id="gpsEnd"
                                            value={formData.gpsEnd}
                                            onChange={(e) => setFormData(prev => ({ ...prev, gpsEnd: e.target.value }))}
                                            placeholder="29.7700,-95.3800"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SECTION 3: Personnel */}
                            <TabsContent value="personnel" className="mt-0 space-y-6">
                                {/* Owner */}
                                <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                                    <h3 className="font-semibold text-slate-800">Owner</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Owner</Label>
                                            <Select value={formData.ownerId} onValueChange={handleOwnerChange}>
                                                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                                                <SelectContent>
                                                    {owners.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Owner Address</Label>
                                            <Input value={formData.ownerAddress} readOnly className="bg-slate-50" />
                                        </div>
                                    </div>
                                    {ownerPocs.length > 0 && (
                                        <div className="col-span-2 space-y-2">
                                            <Label>Owner POCs</Label>
                                            <MultiSelect
                                                options={ownerPocs.map(poc => ({ id: poc.id, label: poc.name, subtitle: poc.title || poc.email || '' }))}
                                                selected={formData.ownerPocIds}
                                                onChange={(ids) => setFormData(prev => ({ ...prev, ownerPocIds: ids }))}
                                                placeholder="Select owner contacts..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Contractor */}
                                <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                                    <h3 className="font-semibold text-slate-800">Contractor</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Contractor</Label>
                                            <Select value={formData.contractorId} onValueChange={handleContractorChange}>
                                                <SelectTrigger><SelectValue placeholder="Select contractor" /></SelectTrigger>
                                                <SelectContent>
                                                    {contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contractor Address</Label>
                                            <Input value={formData.contractorAddress} readOnly className="bg-slate-50" />
                                        </div>
                                    </div>
                                    {contractorPocs.length > 0 && (
                                        <div className="col-span-2 space-y-2">
                                            <Label>Contractor POCs</Label>
                                            <MultiSelect
                                                options={contractorPocs.map(poc => ({ id: poc.id, label: poc.name, subtitle: poc.title || poc.email || '' }))}
                                                selected={formData.contractorPocIds}
                                                onChange={(ids) => setFormData(prev => ({ ...prev, contractorPocIds: ids }))}
                                                placeholder="Select contractor contacts..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Inspector */}
                                <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                                    <h3 className="font-semibold text-slate-800">Inspector</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Inspector</Label>
                                            <Select value={formData.inspectorId} onValueChange={handleInspectorChange}>
                                                <SelectTrigger><SelectValue placeholder="Select inspector" /></SelectTrigger>
                                                <SelectContent>
                                                    {inspectors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Inspector Address</Label>
                                            <Input value={formData.inspectorAddress} readOnly className="bg-slate-50" />
                                        </div>
                                    </div>
                                    {inspectorPocs.length > 0 && (
                                        <div className="col-span-2 space-y-2">
                                            <Label>Inspector POCs</Label>
                                            <MultiSelect
                                                options={inspectorPocs.map(poc => ({ id: poc.id, label: poc.name, subtitle: poc.title || poc.email || '' }))}
                                                selected={formData.inspectorPocIds}
                                                onChange={(ids) => setFormData(prev => ({ ...prev, inspectorPocIds: ids }))}
                                                placeholder="Select inspector contacts..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Internal Team */}
                                <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                                    <h3 className="font-semibold text-slate-800">Internal Team</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Project Managers</Label>
                                            <MultiSelect
                                                options={filterEmployeesByRole('PM').map(e => ({ id: e.id, label: e.name, subtitle: e.employeeId }))}
                                                selected={formData.pmIds}
                                                onChange={(ids) => setFormData(prev => ({ ...prev, pmIds: ids }))}
                                                placeholder="Select project managers..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Supervisors</Label>
                                            <MultiSelect
                                                options={filterEmployeesByRole('Supervisor').map(e => ({ id: e.id, label: e.name, subtitle: e.employeeId }))}
                                                selected={formData.supervisorIds}
                                                onChange={(ids) => setFormData(prev => ({ ...prev, supervisorIds: ids }))}
                                                placeholder="Select supervisors..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Leads</Label>
                                            <MultiSelect
                                                options={filterEmployeesByRole('Lead').map(e => ({ id: e.id, label: e.name, subtitle: e.employeeId }))}
                                                selected={formData.leadIds}
                                                onChange={(ids) => setFormData(prev => ({ ...prev, leadIds: ids }))}
                                                placeholder="Select leads..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Workers</Label>
                                            <MultiSelect
                                                options={filterEmployeesByRole('Worker').map(e => ({ id: e.id, label: e.name, subtitle: e.employeeId }))}
                                                selected={formData.workerIds}
                                                onChange={(ids) => setFormData(prev => ({ ...prev, workerIds: ids }))}
                                                placeholder="Select workers..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SECTION 4: Schedule */}
                            <TabsContent value="schedule" className="mt-0 space-y-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="estimatedStartDate">Estimated Start Date</Label>
                                        <Input
                                            id="estimatedStartDate"
                                            type="date"
                                            value={formData.estimatedStartDate}
                                            onChange={(e) => {
                                                const startDate = e.target.value;
                                                let duration: number | null = null;
                                                if (startDate && formData.estimatedEndDate) {
                                                    const start = new Date(startDate);
                                                    const end = new Date(formData.estimatedEndDate);
                                                    duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                }
                                                setFormData(prev => ({ ...prev, estimatedStartDate: startDate, estimatedDurationDays: duration }));
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="estimatedEndDate">Estimated End Date</Label>
                                        <Input
                                            id="estimatedEndDate"
                                            type="date"
                                            value={formData.estimatedEndDate}
                                            onChange={(e) => {
                                                const endDate = e.target.value;
                                                let duration: number | null = null;
                                                if (formData.estimatedStartDate && endDate) {
                                                    const start = new Date(formData.estimatedStartDate);
                                                    const end = new Date(endDate);
                                                    duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                }
                                                setFormData(prev => ({ ...prev, estimatedEndDate: endDate, estimatedDurationDays: duration }));
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="estimatedDurationDays">Estimated Duration</Label>
                                        <Input
                                            id="estimatedDurationDays"
                                            value={formData.estimatedDurationDays ? `${formData.estimatedDurationDays} days` : '-'}
                                            readOnly
                                            className="bg-slate-100 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="estimatedDateOnSite">Estimated Date On-Site</Label>
                                        <Input
                                            id="estimatedDateOnSite"
                                            type="date"
                                            value={formData.estimatedDateOnSite}
                                            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDateOnSite: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Shift</Label>
                                        <Select
                                            value={formData.shiftId}
                                            onValueChange={(v) => {
                                                const opt = shiftOptions.find(o => o.id === v);
                                                setFormData(prev => ({ ...prev, shiftId: v, shiftName: opt?.name || '' }));
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                                            <SelectContent>
                                                {shiftOptions.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="scheduleNotes">Notes</Label>
                                    <Textarea
                                        id="scheduleNotes"
                                        value={formData.scheduleNotes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, scheduleNotes: e.target.value }))}
                                        placeholder="Any scheduling notes..."
                                        rows={4}
                                    />
                                </div>
                            </TabsContent>

                            {/* SECTION 5: Documents */}
                            <TabsContent value="documents" className="mt-0 space-y-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Submittals</Label>
                                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                                            <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-500">Multi-file upload</p>
                                            <p className="text-xs text-slate-400">(Coming with Firebase)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Plans</Label>
                                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                                            <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-500">Multi-file upload</p>
                                            <p className="text-xs text-slate-400">(Coming with Firebase)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Signed Contract</Label>
                                        <div className="flex flex-col gap-2">
                                            <input type="file" ref={signedContractRef} onChange={handleFileUpload('signedContract')} className="hidden" />
                                            <Button type="button" variant="outline" onClick={() => signedContractRef.current?.click()}>
                                                <Upload className="h-4 w-4 mr-2" />
                                                {formData.signedContract ? 'Change File' : 'Upload'}
                                            </Button>
                                            {formData.signedContract && (
                                                <Badge variant="outline" className="gap-1 w-fit">
                                                    <FileText className="h-3 w-3" /> Uploaded
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SECTION 6: Materials */}
                            <TabsContent value="materials" className="mt-0 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">Scope - Materials</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={addMaterialRow}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Material
                                    </Button>
                                </div>
                                {formData.materials.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 border border-dashed rounded-lg">
                                        No materials added. Click &quot;Add Material&quot; to start.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formData.materials.map((mat, index) => (
                                            <div key={mat.id} className="grid grid-cols-6 gap-3 items-end p-3 bg-slate-50 rounded-lg">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Material</Label>
                                                    <Select value={mat.materialId} onValueChange={(v) => updateMaterial(index, v)}>
                                                        <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.code}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Description</Label>
                                                    <Input value={mat.description} readOnly className="h-9 bg-white" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Est. Qty</Label>
                                                    <Input
                                                        type="number"
                                                        value={mat.totalEstimatedQty || ''}
                                                        onChange={(e) => {
                                                            const updated = [...formData.materials];
                                                            updated[index].totalEstimatedQty = e.target.value ? parseFloat(e.target.value) : null;
                                                            setFormData(prev => ({ ...prev, materials: updated }));
                                                        }}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">UoM</Label>
                                                    <Input value={mat.uom} readOnly className="h-9 bg-white" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Est. Rolls</Label>
                                                    <Input
                                                        type="number"
                                                        value={mat.totalEstimatedRolls || ''}
                                                        onChange={(e) => {
                                                            const updated = [...formData.materials];
                                                            updated[index].totalEstimatedRolls = e.target.value ? parseFloat(e.target.value) : null;
                                                            setFormData(prev => ({ ...prev, materials: updated }));
                                                        }}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeMaterial(index)} className="h-9 w-9 p-0">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* SECTION 7: Tack Coat */}
                            <TabsContent value="tackcoat" className="mt-0 space-y-6">
                                <h3 className="font-semibold">Scope - Tack Coat</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Tack Coat Type</Label>
                                        <Select
                                            value={formData.tackCoatTypeId}
                                            onValueChange={(v) => {
                                                const opt = tackCoatOptions.find(o => o.id === v);
                                                setFormData(prev => ({ ...prev, tackCoatTypeId: v, tackCoatTypeName: opt?.name || '' }));
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>
                                                {tackCoatOptions.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tackCoatQty">Total Estimated Qty</Label>
                                        <Input
                                            id="tackCoatQty"
                                            type="number"
                                            value={formData.tackCoatQty || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tackCoatQty: e.target.value ? parseFloat(e.target.value) : null }))}
                                            placeholder="500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>UoM</Label>
                                        <Select
                                            value={formData.tackCoatUomId}
                                            onValueChange={(v) => {
                                                const opt = uomOptions.find(o => o.id === v);
                                                setFormData(prev => ({ ...prev, tackCoatUomId: v, tackCoatUomName: opt?.name || '' }));
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select UoM" /></SelectTrigger>
                                            <SelectContent>
                                                {uomOptions.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SECTION 8: Equipment */}
                            <TabsContent value="equipment" className="mt-0 space-y-6">
                                {/* Company-Owned Equipment */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Company-Owned Equipment</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={addOwnedEquipmentRow}>
                                            <Plus className="h-4 w-4 mr-1" /> Add Equipment
                                        </Button>
                                    </div>
                                    {formData.ownedEquipment.length === 0 ? (
                                        <div className="text-center py-6 text-slate-500 border border-dashed rounded-lg">
                                            No owned equipment added.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.ownedEquipment.map((eq, index) => (
                                                <div key={eq.id} className="grid grid-cols-5 gap-3 items-end p-3 bg-blue-50 rounded-lg">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Equipment</Label>
                                                        <Select value={eq.equipmentId} onValueChange={(v) => updateOwnedEquipment(index, v)}>
                                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                                                            <SelectContent>
                                                                {ownedEquipmentOptions.map(e => <SelectItem key={e.id} value={e.id}>{e.code} - {e.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Category</Label>
                                                        <Input value={eq.category} readOnly className="h-9 bg-white" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Start Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={eq.startDate}
                                                            onChange={(e) => {
                                                                const updated = [...formData.ownedEquipment];
                                                                updated[index].startDate = e.target.value;
                                                                setFormData(prev => ({ ...prev, ownedEquipment: updated }));
                                                            }}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Return Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={eq.returnDate}
                                                            onChange={(e) => {
                                                                const updated = [...formData.ownedEquipment];
                                                                updated[index].returnDate = e.target.value;
                                                                setFormData(prev => ({ ...prev, ownedEquipment: updated }));
                                                            }}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeOwnedEquipment(index)} className="h-9 w-9 p-0">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Third Party Equipment */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Third Party Equipment</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={addThirdPartyEquipmentRow}>
                                            <Plus className="h-4 w-4 mr-1" /> Add Equipment
                                        </Button>
                                    </div>
                                    {formData.thirdPartyEquipment.length === 0 ? (
                                        <div className="text-center py-6 text-slate-500 border border-dashed rounded-lg">
                                            No third party equipment added.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.thirdPartyEquipment.map((eq, index) => (
                                                <div key={eq.id} className="grid grid-cols-4 gap-3 items-end p-3 bg-orange-50 rounded-lg">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Description</Label>
                                                        <Input
                                                            value={eq.description}
                                                            onChange={(e) => {
                                                                const updated = [...formData.thirdPartyEquipment];
                                                                updated[index].description = e.target.value;
                                                                setFormData(prev => ({ ...prev, thirdPartyEquipment: updated }));
                                                            }}
                                                            className="h-9"
                                                            placeholder="Equipment description"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Vendor</Label>
                                                        <Input
                                                            value={eq.vendor}
                                                            onChange={(e) => {
                                                                const updated = [...formData.thirdPartyEquipment];
                                                                updated[index].vendor = e.target.value;
                                                                setFormData(prev => ({ ...prev, thirdPartyEquipment: updated }));
                                                            }}
                                                            className="h-9"
                                                            placeholder="Vendor name"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">PO Number</Label>
                                                        <Input
                                                            value={eq.poNumber}
                                                            onChange={(e) => {
                                                                const updated = [...formData.thirdPartyEquipment];
                                                                updated[index].poNumber = e.target.value;
                                                                setFormData(prev => ({ ...prev, thirdPartyEquipment: updated }));
                                                            }}
                                                            className="h-9"
                                                            placeholder="PO-12345"
                                                        />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeThirdPartyEquipment(index)} className="h-9 w-9 p-0">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </PageWrapper>
    );
}
