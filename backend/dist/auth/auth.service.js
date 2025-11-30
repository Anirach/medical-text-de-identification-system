"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    async signup(email, password) {
        const passwordHash = this.hashPassword(password);
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('user with this email already exists');
        }
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
            },
        });
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });
        return {
            token,
            expiresAt,
            user: {
                id: user.id.toString(),
                email: user.email,
            },
        };
    }
    async login(email, password) {
        const passwordHash = this.hashPassword(password);
        const user = await this.prisma.user.findFirst({
            where: {
                email,
                passwordHash,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('invalid email or password');
        }
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });
        return {
            token,
            expiresAt,
            user: {
                id: user.id.toString(),
                email: user.email,
            },
        };
    }
    async logout(token) {
        if (token) {
            await this.prisma.session.deleteMany({
                where: { token },
            });
        }
    }
    async getCurrentUser(token) {
        if (!token) {
            return null;
        }
        const session = await this.prisma.session.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: true,
            },
        });
        if (!session) {
            return null;
        }
        return {
            userID: session.user.id.toString(),
            email: session.user.email,
        };
    }
    async validateSession(token) {
        const authData = await this.getCurrentUser(token);
        if (!authData) {
            throw new common_1.UnauthorizedException('invalid or expired session');
        }
        return authData;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map