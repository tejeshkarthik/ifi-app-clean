

import { Employee } from './employee-storage';
import { Company, POC } from './company-storage';
import { Material } from './material-storage';
import { Equipment } from './equipment-storage';
import { Project, ProjectMaterial } from './project-storage';
import { Workflow, WorkflowLevel } from './workflow-storage';
import { Timesheet } from './timesheet-storage';
import { MaterialUsageLog, IssuesLog } from './forms-storage';
import { LOOKUP_CATEGORIES, LookupCategoryId } from './lookup-storage';
import { JHA, createInitialTasks } from './jha-storage';
import { PreConstructionChecklist, createDefaultChecklists } from './preconstruction-storage';
import { BillOfLading } from './bol-storage';


// ==========================================
// CONFIGURATION & UTILS
// ==========================================

const SEED_VERSION = '2.0.0'; // Client UAT Ready

const generateId = () => crypto.randomUUID();

export const seedGlobalDemoData = () => {
    if (typeof window === 'undefined') return;

    try {
        console.log('🌱 Starting Global Demo Data Seed (v2.0 - Client UAT Ready)...');

        // 1. CLEAR EXISTING DATA =========================================
        console.log('🧹 Clearing local storage...');
        const keysToClear = [
            'ifi_employees_v7',
            'ifi_owners',
            'ifi_contractors',
            'ifi_inspectors',
            'ifi_materials',
            'ifi_equipment',
            'ifi_projects',
            'ifi_workflows',
            'ifi_timesheets',
            'ifi_lookup_tables',
            'ifi_users',
            'ifi_material_usage_logs',
            'ifi_issues_logs',
            'ifi_jha_forms',
            'ifi_preconstruction_checklists',
            'ifi_bills_of_lading',
            'ifi_current_user_email'
        ];

        keysToClear.forEach(key => localStorage.removeItem(key));


        // 2. SEED EMPLOYEES (Source of Truth for Users) ==================
        console.log('👥 Seeding Employees...');

        //  Employee IDs will be captured after seeding (see line ~162)

        const employees: Employee[] = [
            {
                id: generateId(), // Admin
                employeeId: 'ADM-001',
                name: 'Barry Boothe',
                role: 'Admin',
                classId: 'CLS-001',
                className: 'Management',
                craftId: 'CFT-001',
                craftName: 'Office',
                email: 'bboothe@ind-fab.com',
                phone: '555-0101',
                photo: null,
                isActive: true,
                hasAppAccess: true,
                appRole: 'super-admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(), // PM
                employeeId: 'PM-001',
                name: 'Paige Landrum',
                role: 'PM',
                classId: 'CLS-001',
                className: 'Management',
                craftId: 'CFT-001',
                craftName: 'Office',
                email: 'plandrum@ind-fab.com',
                phone: '555-0102',
                photo: null,
                isActive: true,
                hasAppAccess: true,
                appRole: 'pm',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(), // Supervisor
                employeeId: 'SUP-001',
                name: 'Santiago Ramos',
                role: 'Supervisor',
                classId: 'CLS-002',
                className: 'Field',
                craftId: 'CFT-002',
                craftName: 'Paving',
                email: 'sramos@ind-fab.com',
                phone: '555-0103',
                photo: null,
                isActive: true,
                hasAppAccess: true,
                appRole: 'supervisor',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(), // Lead
                employeeId: 'LEAD-001',
                name: 'Milton Molina',
                role: 'Lead',
                classId: 'CLS-002',
                className: 'Field',
                craftId: 'CFT-002',
                craftName: 'Paving',
                email: 'mmolina@ind-fab.com',
                phone: '555-0104',
                photo: null,
                isActive: true,
                hasAppAccess: true,
                appRole: 'lead',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: generateId(), // Worker
                employeeId: 'WORK-001',
                name: 'John Doe',
                role: 'Worker',
                classId: 'CLS-003',
                className: 'Labor',
                craftId: 'CFT-003',
                craftName: 'General',
                email: 'jdoe@ind-fab.com',
                phone: '555-0105',
                photo: null,
                isActive: true,
                hasAppAccess: false,
                appRole: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        localStorage.setItem('ifi_employees_v7', JSON.stringify(employees));

        // 📌 CAPTURE STORED EMPLOYEE IDS for project assignment (FIX #2 - FINAL)
        const pmId = employees.find(e => e.role === 'PM')?.id || '';
        const superId = employees.find(e => e.role === 'Supervisor')?.id || '';
        const leadId = employees.find(e => e.role === 'Lead')?.id || '';
        const workerId = employees.find(e => e.role === 'Worker')?.id || '';


        // 3. SEED COMPANIES WITH POCs ====================================
        console.log('🏢 Seeding Companies with POCs...');

        const ownerId = 'com-owner-001';
        const contractorId = 'com-contr-001';
        const inspectorId = 'com-insp-001';

        const owners: Company[] = [{
            id: ownerId,
            name: 'Industrial Fabrics Inc',
            address: '123 Industrial Way',
            city: 'Houston',
            state: 'TX',
            zip: '77001',
            phone: '555-9999',
            email: 'info@ind-fab.com',
            website: 'ind-fab.com',
            isActive: true,
            pocs: [
                {
                    id: generateId(),
                    name: 'Robert Smith',
                    title: 'Project Director',
                    phone: '555-9991',
                    secondaryPhone: '',
                    email: 'rsmith@ind-fab.com',
                    linkedInUrl: '',
                    notes: 'Primary contact for project coordination',
                    isActive: true
                },
                {
                    id: generateId(),
                    name: 'Jennifer Lee',
                    title: 'Billing Manager',
                    phone: '555-9992',
                    secondaryPhone: '',
                    email: 'jlee@ind-fab.com',
                    linkedInUrl: '',
                    notes: 'Contact for invoicing and payments',
                    isActive: true
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }];

        const contractors: Company[] = [{
            id: contractorId,
            name: 'Reliable Paving Co.',
            address: '456 Construction Blvd',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            phone: '555-8888',
            email: 'contact@reliable.com',
            website: 'reliable.com',
            isActive: true,
            pocs: [
                {
                    id: generateId(),
                    name: 'Mike Johnson',
                    title: 'Site Manager',
                    phone: '555-8881',
                    secondaryPhone: '555-8889',
                    email: 'mjohnson@reliable.com',
                    linkedInUrl: '',
                    notes: 'On-site daily operations lead',
                    isActive: true
                },
                {
                    id: generateId(),
                    name: 'Sarah Davis',
                    title: 'Project Coordinator',
                    phone: '555-8882',
                    secondaryPhone: '',
                    email: 'sdavis@reliable.com',
                    linkedInUrl: '',
                    notes: 'Scheduling and logistics contact',
                    isActive: true
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }];

        const inspectors: Company[] = [{
            id: inspectorId,
            name: 'City Inspectors Dept',
            address: '789 Gov Plaza',
            city: 'San Antonio',
            state: 'TX',
            zip: '78201',
            phone: '555-7777',
            email: 'inspections@city.gov',
            website: 'city.gov/inspections',
            isActive: true,
            pocs: [
                {
                    id: generateId(),
                    name: 'Tom Garcia',
                    title: 'Lead Inspector',
                    phone: '555-7771',
                    secondaryPhone: '',
                    email: 'tgarcia@city.gov',
                    linkedInUrl: '',
                    notes: 'Primary field inspector',
                    isActive: true
                },
                {
                    id: generateId(),
                    name: 'Lisa Martinez',
                    title: 'Assistant Inspector',
                    phone: '555-7772',
                    secondaryPhone: '',
                    email: 'lmartinez@city.gov',
                    linkedInUrl: '',
                    notes: 'Backup inspector for weekend work',
                    isActive: true
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }];

        localStorage.setItem('ifi_owners', JSON.stringify(owners));
        localStorage.setItem('ifi_contractors', JSON.stringify(contractors));
        localStorage.setItem('ifi_inspectors', JSON.stringify(inspectors));


        // 4. SEED MATERIALS & EQUIPMENT ==================================
        console.log('🧱 Seeding Materials & Equipment...');

        const materials: Material[] = [
            {
                id: 'mat-001',
                code: 'ASP-B',
                description: 'Asphalt Type B',
                uomId: 'uom-ton',
                uomName: 'TON',
                fullRollArea: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'mat-002',
                code: 'ASP-C',
                description: 'Asphalt Type C',
                uomId: 'uom-ton',
                uomName: 'TON',
                fullRollArea: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'mat-003',
                code: 'GEO-400',
                description: 'Geotextile 400',
                uomId: 'uom-sy',
                uomName: 'SY',
                fullRollArea: 500,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('ifi_materials', JSON.stringify(materials));

        const equipment: Equipment[] = [
            {
                id: 'eq-001',
                code: 'PVR-01',
                name: 'Paver 1',
                categoryId: 'Pavers',
                categoryName: 'Pavers',
                ownership: 'Owned',
                vendor: '',
                poNumber: '',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'eq-002',
                code: 'RLR-01',
                name: 'Roller 1',
                categoryId: 'Rollers',
                categoryName: 'Rollers',
                ownership: 'Owned',
                vendor: '',
                poNumber: '',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('ifi_equipment', JSON.stringify(equipment));


        // 5. SEED COMPREHENSIVE LOOKUP VALUES ============================
        console.log('📋 Seeding Comprehensive Lookup Values...');

        const lookups: any = {};
        LOOKUP_CATEGORIES.forEach((cat: { id: LookupCategoryId; name: string }) => { lookups[cat.id] = []; });

        const addLookup = (catId: LookupCategoryId, name: string, id?: string) => {
            lookups[catId].push({
                id: id || generateId(),
                name,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        };

        // Asphalt Mix Types
        addLookup('asphalt_mix_types', 'Type B');
        addLookup('asphalt_mix_types', 'Type C');
        addLookup('asphalt_mix_types', 'Type D');
        addLookup('asphalt_mix_types', 'Type E');

        // Oil Types
        addLookup('oil_types', 'PG 64-22');
        addLookup('oil_types', 'PG 70-22');
        addLookup('oil_types', 'PG 76-22');

        // Oil Grades
        addLookup('oil_grades', 'Standard');
        addLookup('oil_grades', 'Premium');
        addLookup('oil_grades', 'Heavy Duty');

        // Tack Coat Types
        addLookup('tack_coat_types', 'SS-1');
        addLookup('tack_coat_types', 'SS-1h');
        addLookup('tack_coat_types', 'CSS-1');

        // High Grade Types
        addLookup('high_grade_types', 'Grade A');
        addLookup('high_grade_types', 'Grade B');
        addLookup('high_grade_types', 'Premium');

        // UoM Types
        addLookup('uom_types', 'TON');
        addLookup('uom_types', 'SY');
        addLookup('uom_types', 'GAL');
        addLookup('uom_types', 'LF');
        addLookup('uom_types', 'EA');

        // Standby Reasons
        addLookup('standby_reasons', 'Weather');
        addLookup('standby_reasons', 'Customer');
        addLookup('standby_reasons', 'Equipment Breakdown');

        // Issue Types
        addLookup('issue_types', 'Safety Concern');
        addLookup('issue_types', 'Quality Issue');
        addLookup('issue_types', 'Equipment Failure');
        addLookup('issue_types', 'Material Shortage');

        // Employee Classes
        addLookup('employee_classes', 'Management');
        addLookup('employee_classes', 'Field');
        addLookup('employee_classes', 'Labor');

        // Employee Crafts
        addLookup('employee_crafts', 'Office');
        addLookup('employee_crafts', 'Paving');
        addLookup('employee_crafts', 'General Labor');

        // Equipment Categories
        addLookup('equipment_categories', 'Pavers');
        addLookup('equipment_categories', 'Rollers');
        addLookup('equipment_categories', 'Trucks');

        // Project/Contract Status
        addLookup('project_status_types', 'Active', 'status-active');
        addLookup('project_status_types', 'Planning', 'status-planning');
        addLookup('project_status_types', 'Completed', 'status-completed');
        addLookup('contract_status_types', 'Pending');
        addLookup('contract_status_types', 'Signed');

        // Shift Types
        addLookup('shift_types', 'Day', 'shift-day');
        addLookup('shift_types', 'Night', 'shift-night');

        // Warehouse Locations
        addLookup('warehouse_locations', 'Houston Warehouse');
        addLookup('warehouse_locations', 'Austin Warehouse');

        // Lane Types
        addLookup('lane_types', 'EB - Eastbound');
        addLookup('lane_types', 'WB - Westbound');
        addLookup('lane_types', 'NB - Northbound');
        addLookup('lane_types', 'SB - Southbound');

        // Surface Types
        addLookup('surface_types', 'Milled');
        addLookup('surface_types', 'Levelup');
        addLookup('surface_types', 'Existing');

        localStorage.setItem('ifi_lookup_tables', JSON.stringify(lookups));

        // 📌 CAPTURE LOOKUP IDS for DFR seeding (FIX #1)
        const oilPg6422Id = lookups.oil_types?.find((v: { id: string; name: string }) => v.name === 'PG 64-22')?.id || '';
        const tackSS1Id = lookups.tack_coat_types?.find((v: { id: string; name: string }) => v.name === 'SS-1')?.id || '';
        const asphaltTypeBId = lookups.asphalt_mix_types?.find((v: { id: string; name: string }) => v.name === 'Type B')?.id || '';
        const highGradeAId = lookups.high_grade_types?.find((v: { id: string; name: string }) => v.name === 'Grade A')?.id || '';


        // 6. SEED PROJECTS ===============================================
        console.log('🏗️ Seeding Projects...');

        const projectId = 'proj-001';

        // Get POC IDs from companies for COMPLETE project setup
        const ownerPocId1 = owners[0].pocs[0].id; // Robert Smith
        const ownerPocId2 = owners[0].pocs[1].id; // Jennifer Lee
        const contractorPocId1 = contractors[0].pocs[0].id; // Mike Johnson  
        const contractorPocId2 = contractors[0].pocs[1].id; // Sarah Williams
        const inspectorPocId1 = inspectors[0].pocs[0].id; // Tom Garcia
        const inspectorPocId2 = inspectors[0].pocs[1].id; // Lisa Martinez

        const projects: Project[] = [
            {
                id: projectId,
                name: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                isDraft: false,

                statusId: 'status-active',
                statusName: 'Active',
                salespersonId: '',
                salespersonName: '',
                contractStatusId: '',
                contractStatusName: '',
                contractDocument: null,

                streetAddress: '123 Hwy 290',
                county: 'Harris',
                city: 'Houston',
                state: 'TX',
                zip: '77001',
                gpsStart: '29.7, -95.4',
                gpsEnd: '29.8, -95.5',

                ownerId: ownerId,
                ownerName: 'Industrial Fabrics Inc',
                ownerAddress: '123 Industrial Way',
                ownerPocIds: [ownerPocId1, ownerPocId2], // ✅ COMPLETE
                contractorId: contractorId,
                contractorName: 'Reliable Paving Co.',
                contractorAddress: '456 Construction Blvd',
                contractorPocIds: [contractorPocId1, contractorPocId2], // ✅ COMPLETE
                inspectorId: inspectorId,
                inspectorName: 'City Inspectors Dept',
                inspectorAddress: '789 Gov Plaza',
                inspectorPocIds: [inspectorPocId1, inspectorPocId2], // ✅ COMPLETE

                // PERSONNEL - COMPLETE INTERNAL TEAM
                pmIds: [pmId],
                supervisorIds: [superId],
                leadIds: [leadId],
                workerIds: [workerId],

                estimatedStartDate: '2025-01-15',
                estimatedEndDate: '2025-06-15',
                estimatedDurationDays: 150,
                estimatedDateOnSite: '2025-01-20',
                shiftId: 'shift-day',
                shiftName: 'Day',
                scheduleNotes: 'Standard day shift',

                submittals: [],
                plans: [],
                signedContract: null,

                materials: [
                    {
                        id: generateId(),
                        materialId: 'mat-001',
                        materialCode: 'ASP-B',
                        description: 'Asphalt Type B',
                        totalEstimatedQty: 1000,
                        uom: 'TON',
                        totalEstimatedRolls: null
                    }
                ],

                tackCoatTypeId: '',
                tackCoatTypeName: '',
                tackCoatQty: null,
                tackCoatUomId: '',
                tackCoatUomName: '',

                ownedEquipment: [],
                thirdPartyEquipment: [],

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        localStorage.setItem('ifi_projects', JSON.stringify(projects));


        // 7. SEED WORKFLOWS (PM-ONLY APPROVAL) ==========================
        console.log('🔄 Seeding Workflows (PM Approval)...');

        const workflows: Workflow[] = [
            {
                id: 'wf-timesheet',
                name: 'Standard Timesheet Approval',
                isActive: true,
                assignedForms: ['timesheet'],
                levels: [
                    {
                        id: generateId(),
                        levelNumber: 1,
                        levelType: 'Users',
                        approvalType: 'Any',
                        approverIds: [pmId], // PM ONLY
                        approverNames: ['Paige Landrum']
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'wf-dfr',
                name: 'Daily Field Report Approval',
                isActive: true,
                assignedForms: ['material_usage'],
                levels: [
                    {
                        id: generateId(),
                        levelNumber: 1,
                        levelType: 'Users',
                        approvalType: 'Any',
                        approverIds: [pmId], // PM ONLY
                        approverNames: ['Paige Landrum']
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        localStorage.setItem('ifi_workflows', JSON.stringify(workflows));


        // 8. SEED TIMESHEETS =============================================
        console.log('⏱️ Seeding Timesheets...');

        const timesheets: Timesheet[] = [
            {
                id: 'ts-001',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                date: '2025-02-17',
                shiftId: 'shift-day',
                shiftName: 'Day',

                status: 'Approved',

                entries: [
                    {
                        id: generateId(),
                        employeeId: leadId,
                        employeeName: 'Milton Molina',
                        certifiedIn: '07:00',
                        certifiedOut: '15:30',
                        nonCertifiedIn: '',
                        nonCertifiedOut: '',
                        totalHours: 8.5
                    }
                ],

                notes: 'Good progress',
                submittedAt: new Date().toISOString(),
                submittedBy: superId,

                approvalLevel: 2,
                approvalHistory: [
                    {
                        level: 1,
                        status: 'approved',
                        byUserId: pmId,
                        byUserName: 'Paige Landrum',
                        date: new Date().toISOString(),
                        comment: 'Approved'
                    }
                ],

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'ts-002',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                date: '2025-02-18',
                shiftId: 'shift-day',
                shiftName: 'Day',

                status: 'Pending Approval',

                entries: [
                    {
                        id: generateId(),
                        employeeId: leadId,
                        employeeName: 'Milton Molina',
                        certifiedIn: '07:00',
                        certifiedOut: '17:00',
                        nonCertifiedIn: '',
                        nonCertifiedOut: '',
                        totalHours: 10
                    }
                ],

                notes: '',
                submittedAt: new Date().toISOString(),
                submittedBy: superId,

                approvalLevel: 1,
                approvalHistory: [],

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        localStorage.setItem('ifi_timesheets', JSON.stringify(timesheets));


        // 9. SEED DAILY FIELD REPORTS (Material Usage Logs) =============
        console.log('📊 Seeding Daily Field Reports...');

        const materialUsageLogs: MaterialUsageLog[] = [
            {
                id: 'dfr-001',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                date: '2025-02-17',

                oilTypeId: oilPg6422Id,
                oilTypeName: 'PG 64-22',
                oilSuppliedById: contractorId,
                oilSuppliedByName: 'Reliable Paving Co.',
                asphaltMixTypeId: asphaltTypeBId,
                asphaltMixTypeName: 'Type B',
                oilGradeId: '',
                oilGradeName: 'Standard',
                highGradeId: highGradeAId,
                highGradeName: 'Grade A',

                stations: [
                    {
                        id: generateId(),
                        fromStation: '100+00',
                        toStation: '105+50',
                        widthFt: 12,
                        sy: 660,
                        laneId: '',
                        laneName: 'EB - Eastbound'
                    }
                ],

                materials: [
                    {
                        id: generateId(),
                        materialId: 'mat-003',
                        materialCode: 'GEO-400',
                        materialDescription: 'Geotextile 400',
                        rollsUsed: 2,
                        rollArea: 500,
                        sy: 1000,
                        syOverride: false,
                        overlapPercent: 10,
                        netSy: 900
                    }
                ],

                tackCoatTypeId: tackSS1Id,
                tackCoatTypeName: 'SS-1',
                tackStartGallons: 2500,
                tackEndGallons: 2315,
                tackTotalGallons: 185,
                gridBeneath: false,
                gridOnTop: false,
                applicationRate: null,

                standbyCustomer: false,
                standbyDemobilization: false,
                standbyWeather: false,
                standbyDuration: '',
                comments: 'Standard installation',

                supervisorId: superId,
                supervisorName: 'Santiago Ramos',
                supervisorSignature: '',
                contractorPocId: '',
                contractorPocName: '',
                contractorSignature: '',

                totalSy: 660,
                totalNetSy: 900,

                status: 'approved',
                approvalLevel: 2,
                approvalHistory: [
                    {
                        level: 1,
                        status: 'approved',
                        byUserId: pmId,
                        byUserName: 'Paige Landrum',
                        date: new Date().toISOString(),
                        comment: 'Approved'
                    }
                ],

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: superId
            },
            {
                id: 'dfr-002',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                date: '2025-02-18',

                oilTypeId: oilPg6422Id,
                oilTypeName: 'PG 64-22',
                oilSuppliedById: contractorId,
                oilSuppliedByName: 'Reliable Paving Co.',
                asphaltMixTypeId: asphaltTypeBId,
                asphaltMixTypeName: 'Type B',
                oilGradeId: '',
                oilGradeName: 'Standard',
                highGradeId: highGradeAId,
                highGradeName: 'Grade A',

                stations: [
                    {
                        id: generateId(),
                        fromStation: '105+50',
                        toStation: '110+00',
                        widthFt: 12,
                        sy: 540,
                        laneId: '',
                        laneName: 'EB - Eastbound'
                    }
                ],

                materials: [
                    {
                        id: generateId(),
                        materialId: 'mat-003',
                        materialCode: 'GEO-400',
                        materialDescription: 'Geotextile 400',
                        rollsUsed: 1,
                        rollArea: 500,
                        sy: 500,
                        syOverride: false,
                        overlapPercent: 10,
                        netSy: 450
                    }
                ],

                tackCoatTypeId: tackSS1Id,
                tackCoatTypeName: 'SS-1',
                tackStartGallons: 2315,
                tackEndGallons: 2165,
                tackTotalGallons: 150,
                gridBeneath: false,
                gridOnTop: false,
                applicationRate: null,

                standbyCustomer: false,
                standbyDemobilization: false,
                standbyWeather: false,
                standbyDuration: '',
                comments: '',

                supervisorId: superId,
                supervisorName: 'Santiago Ramos',
                supervisorSignature: '',
                contractorPocId: '',
                contractorPocName: '',
                contractorSignature: '',

                totalSy: 540,
                totalNetSy: 450,

                status: 'pending',
                approvalLevel: 1,
                approvalHistory: [],

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: superId
            }
        ];

        localStorage.setItem('ifi_material_usage_logs', JSON.stringify(materialUsageLogs));


        // 10. SEED ISSUES LOG ============================================
        console.log('📋 Seeding Issues Log...');

        const issuesLogs: IssuesLog[] = [
            {
                id: 'issue-001',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                date: '2025-02-17',
                time: '14:30',
                issueTypeId: '',
                issueTypeName: 'Weather',
                flag: 'normal',
                description: 'Heavy rain started at 2pm, causing temporary work stoppage for safety. Crew secured materials and equipment.',
                temperature: 62,
                hasRain: true,
                rainDuration: '3 hours',
                hasPlantBreakdown: false,
                plantBreakdownDuration: '',
                photos: [],
                reportedById: superId,
                reportedByName: 'Santiago Ramos',
                notes: 'Will resume tomorrow weather permitting. No material damage.',
                status: 'approved',
                createdAt: new Date('2025-02-17T14:45:00').toISOString(),
                updatedAt: new Date('2025-02-17T14:45:00').toISOString()
            },
            {
                id: 'issue-002',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                date: '2025-02-18',
                time: '10:15',
                issueTypeId: '',
                issueTypeName: 'Material Quality',
                flag: 'urgent',
                description: 'GEO-400 roll #3 showed defects (tears along edge). Requesting replacement roll from warehouse.',
                temperature: 68,
                hasRain: false,
                rainDuration: '',
                hasPlantBreakdown: false,
                plantBreakdownDuration: '',
                photos: [],
                reportedById: leadId,
                reportedByName: 'Milton Molina',
                notes: 'Paused installation on section 105+00 until replacement arrives. Moved crew to adjacent area.',
                status: 'pending',
                createdAt: new Date('2025-02-18T10:20:00').toISOString(),
                updatedAt: new Date('2025-02-18T10:20:00').toISOString()
            }
        ];

        localStorage.setItem('ifi_issues_logs', JSON.stringify(issuesLogs));


        // 11. SEED SAFETY (JHA) FORMS ======================================
        console.log('🦺 Seeding Safety (JHA) Forms...');

        const jhaForms: JHA[] = [
            {
                id: 'jha-001',
                formNo: 'JHA-20250217-001',
                date: '2025-02-17',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                location: 'Hwy 290, Houston, TX',
                jobDescription: 'Geotextile Installation - Highway Paving',
                timeOfDay: 'AM',
                shiftId: 'shift-day',
                shiftName: 'Day',
                completedById: superId,
                completedByName: 'Santiago Ramos',
                tasks: createInitialTasks(),
                additionalNotes: 'Crew briefed on traffic control procedures. All PPE inspected. Weather conditions favorable.',
                crewAttendance: [
                    { employeeId: leadId, employeeName: 'Milton Molina', attended: true },
                    { employeeId: workerId, employeeName: 'John Doe', attended: true }
                ],
                crewCount: 2,
                signature: '',
                signedName: 'Santiago Ramos',
                signedDate: '2025-02-17',
                status: 'approved',
                createdAt: new Date('2025-02-17T07:00:00').toISOString(),
                updatedAt: new Date('2025-02-17T07:00:00').toISOString()
            },
            {
                id: 'jha-002',
                formNo: 'JHA-20250218-001',
                date: '2025-02-18',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                location: 'Hwy 290, Houston, TX',
                jobDescription: 'Geotextile Installation - Highway Paving',
                timeOfDay: 'AM',
                shiftId: 'shift-day',
                shiftName: 'Day',
                completedById: superId,
                completedByName: 'Santiago Ramos',
                tasks: createInitialTasks(),
                additionalNotes: 'Extra caution advised due to yesterday\'s rain. Ground may be soft in some areas.',
                crewAttendance: [
                    { employeeId: leadId, employeeName: 'Milton Molina', attended: true },
                    { employeeId: workerId, employeeName: 'John Doe', attended: true }
                ],
                crewCount: 2,
                signature: '',
                signedName: 'Santiago Ramos',
                signedDate: '2025-02-18',
                status: 'draft',
                createdAt: new Date('2025-02-18T07:00:00').toISOString(),
                updatedAt: new Date('2025-02-18T07:00:00').toISOString()
            }
        ];

        localStorage.setItem('ifi_jha_forms', JSON.stringify(jhaForms));


        // 12. SEED PRE-CONSTRUCTION CHECKLIST =============================
        console.log('📝 Seeding Pre-Construction Checklist...');

        const checklists = createDefaultChecklists();

        // Mark all checklist items as checked for approved status
        const checkedTruckInspection = checklists.truck.map(item => ({ ...item, checked: true }));
        const checkedTrailerInspection = checklists.trailer.map(item => ({ ...item, checked: true }));
        const checkedMiscEquipment = checklists.misc.map(item => ({ ...item, checked: true }));

        const preconChecklists: PreConstructionChecklist[] = [
            {
                id: 'pcc-001',
                formNumber: 'PCC-20250115-001',

                // Project
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',

                // Project Team
                projectTeam: [pmId],
                projectTeamNames: ['Paige Landrum'],
                salesPerson: [pmId],
                salesPersonNames: ['Paige Landrum'],

                // Contractor Info
                contractor: 'Reliable Paving Co.',
                contractorId: contractorId,
                superintendentId: superId,
                superintendentName: 'Santiago Ramos',
                superintendentPhone: '555-0103',
                superintendentEmail: 'sramos@ind-fab.com',
                contractorCell: '555-8888',
                contractorEmail: 'contact@reliable.com',
                projectManager: 'Paige Landrum',
                pmPhone: '555-0102',
                pmEmail: 'plandrum@ind-fab.com',
                subcontractContact: '',
                subcontractPhone: '',
                subcontractEmail: '',

                // Project Address
                projectAddress: '123 Hwy 290, Houston, TX 77001',

                // Special Instructions
                specialInstructions: 'Traffic control required during daylight hours. Coordinate with TxDOT for lane closures. Material delivery scheduled for early morning to avoid peak traffic.',

                // Project Type
                projectType: 'State',
                projectTypeOther: '',

                // Day/Night
                dayTime: true,
                nightTime: false,

                // Notification
                rubberTireNotification: true,

                // Plans
                plansReviewedById: pmId,
                plansReviewedByName: 'Paige Landrum',

                // Submittals
                submittals: 'Approved',

                // Project Details
                contractNumber: 'CSJ-0912-15-089',
                estimatedStartDate: '2025-01-20',
                estimatedDuration: '90 days',
                equipmentOnSiteDate: '2025-01-18',

                // Materials
                materials: [
                    {
                        id: generateId(),
                        code: 'GEO-400',
                        description: 'Geotextile 400',
                        selected: true,
                        qty: 100
                    }
                ],
                cutRollsRequired: true,
                cutRollSize: '250 SY',
                cutRollQty: 10,
                extensionBarsRequired: true,
                warehouse: 'Houston',

                // Tack Coat
                projectSY: 50000,
                surfaceTypes: [
                    { type: 'Milled', selected: true, rate: 0.2, gallons: 10000, lbs: 83500 },
                    { type: 'Levelup', selected: false, rate: 0.15, gallons: 0, lbs: 0 },
                    { type: 'Seal Coat', selected: false, rate: 0.23, gallons: 0, lbs: 0 }
                ],
                tackCoatTypes: ['SS-1', 'SS-1h'],

                // Oil Source
                oilSource: 'IFI sprays & supplies oil',
                oilCompany: 'Marathon Petroleum',
                oilAddress: '5200 Westheimer Rd, Houston, TX 77056',
                oilBusHrs: '7am - 5pm',
                oilPULoad: '8,000 gallons',
                oilPOIFI: 'PO-2025-001',
                oilContact1: 'Mike Johnson - 555-7890',
                oilContact2: 'Sarah Davis - 555-7891',

                // Equipment - Tractor
                tractorType: 'Kubota with rollers',
                numTractors: 2,
                trailerUnit: 'TRL-105',
                tractorUnit: 'KBT-220',

                // Equipment - Blowers
                backpackBlowers: true,
                gasBlower4Wheeler: true,

                // Equipment - Pipe Length
                pipeLengths: ['12.5\' - schedule 40 steel', '13.6\' - schedule 40 steel'],

                // Equipment - Other Items
                otherItems: ['Core pullers', 'New brushes on trailer'],

                // Equipment - Van/Truck
                vanTruckType: '26\' Penske van w/lift gate',

                // Checklists
                truckInspection: checkedTruckInspection,
                trailerInspection: checkedTrailerInspection,
                miscEquipment: checkedMiscEquipment,

                // Equipment Page Tractor
                equipmentTractorType: 'Kubota with rollers',
                equipmentNumTractors: 2,
                equipmentPipeLengths: ['12.5\' - schedule 40 steel', '13.6\' - schedule 40 steel'],

                // Completion
                completedById: pmId,
                completedByName: 'Paige Landrum',
                dateCompleted: '2025-01-15',
                dateSentToErnesto: '2025-01-16',
                dateSentToBobby: '2025-01-16',
                signature: '',

                // Meta
                status: 'approved',
                createdAt: new Date('2025-01-15T14:00:00').toISOString(),
                updatedAt: new Date('2025-01-15T14:00:00').toISOString(),
                createdBy: pmId
            }
        ];

        localStorage.setItem('ifi_preconstruction_checklists', JSON.stringify(preconChecklists));


        // 13. SEED BILL OF LADING ========================================
        console.log('📦 Seeding Bill of Lading...');

        const billsOfLading: BillOfLading[] = [
            {
                id: 'bol-001',
                projectId: projectId,
                projectName: 'Hwy 290 Expansion',
                epNumber: '25-1001',
                fromDate: '2025-02-17',
                toDate: '2025-02-17',

                // Aggregated Material Summary
                materialsSummary: [
                    {
                        materialCode: 'GEO-400',
                        materialDescription: 'Geotextile 400',
                        totalRolls: 2.0,
                        totalNetSy: 900
                    }
                ],

                // Standby Summary
                standbySummary: [],

                // Totals
                totalGallonsUsed: 0,
                totalNetSy: 900,

                // BOL specific
                description: 'FIBERGLASS REINFORCED FABRIC',
                notes: 'Week 1 installation - Hwy 290 Expansion. Material installed per specifications. Quality inspection passed.',

                // Source
                sourceReportIds: ['dfr-001'],

                // Signatures
                supervisorSignature: '',
                supervisorName: 'Santiago Ramos',
                customerSignature: '',
                customerName: 'Mike Johnson',

                // Meta
                status: 'approved',
                createdAt: new Date('2025-02-17T17:00:00').toISOString(),
                updatedAt: new Date('2025-02-17T17:00:00').toISOString(),
                createdBy: superId
            }
        ];

        localStorage.setItem('ifi_bills_of_lading', JSON.stringify(billsOfLading));


        // 14. CLEANUP & ALERT ============================================
        console.log('✅ Global Seed Complete (Client UAT Ready)!');

        // Force login as Admin
        localStorage.setItem('ifi_current_user_email', 'bboothe@ind-fab.com');

        alert('✅ Client UAT Demo Data Ready!\n\n✓ Lookup values populated\n✓ POCs added\n✓ Daily Field Reports seeded\n✓ PM-only approval workflow\n\nApp will reload now.');
        window.location.reload();

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        alert('Seeding Failed! Check console.');
    }
};
