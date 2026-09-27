export interface RegistrationRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
