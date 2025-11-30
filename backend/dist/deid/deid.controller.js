"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeidController = void 0;
const common_1 = require("@nestjs/common");
const deid_service_1 = require("./deid.service");
const auth_guard_1 = require("../auth/auth.guard");
const auth_service_1 = require("../auth/auth.service");
let DeidController = class DeidController {
    constructor(deidService, authService) {
        this.deidService = deidService;
        this.authService = authService;
    }
    async process(body) {
        return this.deidService.process(body);
    }
    async processWithLLM(body) {
        return this.deidService.processWithLLM(body);
    }
    async validateEntities(body) {
        return this.deidService.validateEntities(body);
    }
    async listMaskKeywords(req) {
        return this.deidService.listMaskKeywords(req.user.userID);
    }
    async createMaskKeyword(req, body) {
        if (!body.keyword || !body.entityType) {
            throw new common_1.BadRequestException('keyword and entityType are required');
        }
        return this.deidService.createMaskKeyword(req.user.userID, body.keyword, body.entityType);
    }
    async updateMaskKeyword(req, id, body) {
        await this.deidService.updateMaskKeyword(req.user.userID, parseInt(id, 10), body.keyword, body.entityType);
        return { success: true };
    }
    async deleteMaskKeyword(req, id) {
        await this.deidService.deleteMaskKeyword(req.user.userID, parseInt(id, 10));
        return { success: true };
    }
};
exports.DeidController = DeidController;
__decorate([
    (0, common_1.Post)('process'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeidController.prototype, "process", null);
__decorate([
    (0, common_1.Post)('process-with-llm'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeidController.prototype, "processWithLLM", null);
__decorate([
    (0, common_1.Post)('validate-entities'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeidController.prototype, "validateEntities", null);
__decorate([
    (0, common_1.Get)('mask-keywords'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeidController.prototype, "listMaskKeywords", null);
__decorate([
    (0, common_1.Post)('mask-keywords'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DeidController.prototype, "createMaskKeyword", null);
__decorate([
    (0, common_1.Put)('mask-keywords/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DeidController.prototype, "updateMaskKeyword", null);
__decorate([
    (0, common_1.Delete)('mask-keywords/:id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeidController.prototype, "deleteMaskKeyword", null);
exports.DeidController = DeidController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [deid_service_1.DeidService,
        auth_service_1.AuthService])
], DeidController);
//# sourceMappingURL=deid.controller.js.map