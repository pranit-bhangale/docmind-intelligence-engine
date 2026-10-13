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

export interface ForgotPasswordEmail {
  email: string;
  companyCode?: string;
}

export interface PasswordResponse {
  challengeId?: string;
  message: string;
}

export interface VerifyOtpRequest {
  challengeId: string;
  otp: string;
  companyCode?: string;
}

export interface VerificationResponse {
  message: string;
}

export interface PasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface ChangeForgotPasswordRequest {
  email: string;
  passwordRequest: PasswordRequest;
  companyCode?: string;
}

