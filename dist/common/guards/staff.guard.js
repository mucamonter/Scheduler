"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffGuard = void 0;
const common_1 = require("@nestjs/common");
let StaffGuard = class StaffGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const papel = req.session?.papel;
        if (!papel) {
            throw new common_1.UnauthorizedException('Sessão expirada. Faça login novamente.');
        }
        const papeisPermitidos = ['admin', 'balconista', 'visualizador'];
        if (!papeisPermitidos.includes(papel)) {
            throw new common_1.ForbiddenException('Acesso negado.');
        }
        return true;
    }
};
exports.StaffGuard = StaffGuard;
exports.StaffGuard = StaffGuard = __decorate([
    (0, common_1.Injectable)()
], StaffGuard);
