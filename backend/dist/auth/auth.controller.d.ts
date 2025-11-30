import { Request, Response } from 'express';
import { AuthService } from './auth.service';
interface SignupRequest {
    email: string;
    password: string;
}
interface LoginRequest {
    email: string;
    password: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signup(body: SignupRequest, res: Response): Promise<{
        user: {
            id: string;
            email: string;
        };
    }>;
    login(body: LoginRequest, res: Response): Promise<{
        user: {
            id: string;
            email: string;
        };
    }>;
    logout(req: Request, res: Response): Promise<{
        success: boolean;
    }>;
    getCurrentUser(req: Request): Promise<{
        user: {
            id: string;
            email: string;
        };
    } | {
        user?: undefined;
    }>;
}
export {};
