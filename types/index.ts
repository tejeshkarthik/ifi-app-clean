// IFI Field App - Type Definitions

// User roles as defined in the spec
export type UserRole = 'admin' | 'pm' | 'supervisor';

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  assignedProjects?: string[];
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Form status workflow
export type FormStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
