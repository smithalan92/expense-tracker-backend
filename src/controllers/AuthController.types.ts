import { Request } from "@hapi/hapi";

export interface LoginRequest extends Request {
  payload: {
    email: string;
    password: string;
  };
}

export interface LoginResponse {
  token: string;
}
