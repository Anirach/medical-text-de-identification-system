import { PrismaService } from '../prisma/prisma.service';
export interface AuthData {
    userID: string;
    email: string;
}
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    private hashPassword;
    private generateToken;
    signup(email: string, password: string): Promise<{
        token: string;
        expiresAt: Date;
        user: {
            id: string;
            email: string;
        };
    }>;
    login(email: string, password: string): Promise<{
        token: string;
        expiresAt: Date;
        user: {
            id: string;
            email: string;
        };
    }>;
    logout(token: string): Promise<void>;
    getCurrentUser(token: string | undefined): Promise<AuthData | null>;
    validateSession(token: string): Promise<AuthData>;
}
