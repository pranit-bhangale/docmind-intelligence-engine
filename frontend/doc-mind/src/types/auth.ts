export interface GrantedAuthority {
  authority: string;
}

export interface UserResponse {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  authorities: GrantedAuthority[];
  deleted: boolean;
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
  companyCode?: string;
}

export interface LoginResponse {
  username: string;
  roles: string[];
}
