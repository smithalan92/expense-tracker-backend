export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  user: LoginUser;
  token: string;
}
