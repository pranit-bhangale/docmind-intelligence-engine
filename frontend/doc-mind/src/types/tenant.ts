export type TenantStatus =
  | 'PENDING'
  | 'PROVISIONING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE';

export interface TenantResponse {
  tenantId: string;
  companyName: string;
  companyCode: string;
  email: string;
  adminFullName: string;
  adminEmail: string;
  adminUsername: string;
  createdAt: string;
  status: TenantStatus;
}

export interface TenantRegisterRequest {
  companyName: string;
  companyCode: string;
  email: string;
  adminFullName: string;
  adminEmail: string;
  adminUsername: string;
  adminPassword: string;
}
