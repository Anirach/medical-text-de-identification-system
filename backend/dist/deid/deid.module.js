"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeidModule = void 0;
const common_1 = require("@nestjs/common");
const deid_controller_1 = require("./deid.controller");
const deid_service_1 = require("./deid.service");
const auth_module_1 = require("../auth/auth.module");
let DeidModule = class DeidModule {
};
exports.DeidModule = DeidModule;
exports.DeidModule = DeidModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [deid_controller_1.DeidController],
        providers: [deid_service_1.DeidService],
    })
], DeidModule);
//# sourceMappingURL=deid.module.js.map