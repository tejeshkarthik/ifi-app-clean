'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Building2, Phone, Mail, MapPin, User, Users } from 'lucide-react';
import { getProjectById, type Project } from '@/lib/project-storage';
import { getCompanyById, type Company, type POC } from '@/lib/company-storage';

interface ProjectInfoCardProps {
    projectId: string;
}

interface ContactInfo {
    companyName: string;
    pocs: {
        name: string;
        phone: string;
        email: string;
    }[];
}

function getContactInfo(
    companyId: string,
    pocIds: string[],
    companyType: 'owners' | 'contractors' | 'inspectors'
): ContactInfo {
    const company = companyId ? getCompanyById(companyType, companyId) : null;

    if (!company) {
        return {
            companyName: '-',
            pocs: [],
        };
    }

    // Get POC details from the company's POC list
    const pocs = company.pocs
        .filter(p => pocIds.includes(p.id) && p.isActive)
        .map(p => ({
            name: p.name || '',
            phone: p.phone || '',
            email: p.email || '',
        }));

    // If no specific POCs assigned, show all active POCs
    const finalPocs = pocs.length > 0 ? pocs : company.pocs.filter(p => p.isActive).map(p => ({
        name: p.name || '',
        phone: p.phone || '',
        email: p.email || '',
    }));

    return {
        companyName: company.name || '-',
        pocs: finalPocs,
    };
}

export function ProjectInfoCard({ projectId }: ProjectInfoCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [project, setProject] = useState<Project | null>(null);
    const [ownerInfo, setOwnerInfo] = useState<ContactInfo | null>(null);
    const [contractorInfo, setContractorInfo] = useState<ContactInfo | null>(null);
    const [inspectorInfo, setInspectorInfo] = useState<ContactInfo | null>(null);

    useEffect(() => {
        if (!projectId) {
            setProject(null);
            return;
        }

        const proj = getProjectById(projectId);
        setProject(proj);

        if (proj) {
            setOwnerInfo(getContactInfo(proj.ownerId, proj.ownerPocIds || [], 'owners'));
            setContractorInfo(getContactInfo(proj.contractorId, proj.contractorPocIds || [], 'contractors'));
            setInspectorInfo(getContactInfo(proj.inspectorId, proj.inspectorPocIds || [], 'inspectors'));
        }
    }, [projectId]);

    if (!project) return null;

    const ContactCard = ({
        title,
        info,
        iconColor
    }: {
        title: string;
        info: ContactInfo;
        iconColor: string;
    }) => (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
            {/* Header */}
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-slate-100`}>
                <Building2 className={`h-4 w-4 ${iconColor}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
            </div>

            {/* Company Name */}
            <div className="font-semibold text-slate-800 mb-3">{info.companyName}</div>

            {/* POC List */}
            {info.pocs.length > 0 ? (
                <div className="space-y-3">
                    {info.pocs.map((poc, idx) => (
                        <div key={idx} className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-medium text-slate-700">{poc.name || 'No name'}</span>
                            </div>
                            {poc.phone && (
                                <div className="flex items-center gap-2 ml-5">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    <a href={`tel:${poc.phone}`} className="text-blue-600 hover:underline text-xs">
                                        {poc.phone}
                                    </a>
                                </div>
                            )}
                            {poc.email && (
                                <div className="flex items-center gap-2 ml-5">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    <a href={`mailto:${poc.email}`} className="text-blue-600 hover:underline text-xs truncate">
                                        {poc.email}
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-slate-400 italic">No contacts assigned</div>
            )}
        </div>
    );

    return (
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
            {/* Header - Clickable */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-800">Project Information</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
            </button>

            {/* Content - Collapsible */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-200">
                    {/* Project Summary Row */}
                    <div className="grid grid-cols-5 gap-4 py-3 text-sm border-b border-slate-200 mb-4">
                        <div>
                            <span className="text-slate-400 text-xs">Project</span>
                            <div className="font-semibold text-slate-800">{project.name}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs">EP Number</span>
                            <div className="font-mono text-slate-700">{project.epNumber || '-'}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs">Location</span>
                            <div className="text-slate-700">
                                {[project.city, project.state].filter(Boolean).join(', ') || '-'}
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs">Shift</span>
                            <div className="text-slate-700">{project.shiftName || '-'}</div>
                        </div>
                        <div>
                            <span className="text-slate-400 text-xs">Status</span>
                            <div className="text-slate-700">{project.statusName || '-'}</div>
                        </div>
                    </div>

                    {/* Three Column Contact Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        {ownerInfo && (
                            <ContactCard
                                title="Owner"
                                info={ownerInfo}
                                iconColor="text-blue-500"
                            />
                        )}
                        {contractorInfo && (
                            <ContactCard
                                title="Contractor"
                                info={contractorInfo}
                                iconColor="text-orange-500"
                            />
                        )}
                        {inspectorInfo && (
                            <ContactCard
                                title="Inspector"
                                info={inspectorInfo}
                                iconColor="text-green-500"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
