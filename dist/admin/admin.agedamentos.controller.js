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
exports.AdminAgendamentosController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const staff_guard_1 = require("../common/guards/staff.guard");
let AdminAgendamentosController = class AdminAgendamentosController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listar(busca, data, status, atendimento) {
        const where = {};
        if (data) {
            const inicioDia = new Date(`${data}T00:00:00.000Z`);
            const fimDia = new Date(`${data}T23:59:59.999Z`);
            where.data = { gte: inicioDia, lte: fimDia };
        }
        if (status) {
            where.status = status;
        }
        if (atendimento) {
            where.atendimento = atendimento;
        }
        if (busca && busca.trim() !== '') {
            const termo = busca.trim();
            where.OR = [
                { nome: { contains: termo } },
                { email: { contains: termo } },
                { telefone: { contains: termo } },
                { endereco: { contains: termo } },
                { motivo: { contains: termo } },
                { tratativa: { contains: termo } },
            ];
        }
        const agendamentos = await this.prisma.agendamentos.findMany({
            where,
            orderBy: { data: 'desc' },
        });
        return { agendamentos };
    }
    async atualizarStatus(id, body) {
        const agendamento = await this.prisma.agendamentos.findUnique({ where: { id } });
        if (!agendamento) {
            throw new common_1.NotFoundException(`Agendamento com ID ${id} não encontrado.`);
        }
        const statusValidos = ['pedido_pendente', 'pedido_atendido', 'pedido_nao_atendido', 'cancelado'];
        if (body.status && !statusValidos.includes(body.status)) {
            throw new common_1.BadRequestException(`Status inválido ('${body.status}'). Os valores permitidos são: ${statusValidos.join(', ')}`);
        }
        if (!agendamento) {
            throw new common_1.NotFoundException(`Agendamento com ID ${id} não encontrado.`);
        }
        const agendamentoAtualizado = await this.prisma.agendamentos.update({
            where: { id },
            data: {
                ...(body.status && { status: body.status }),
                ...(body.tratativa !== undefined && { tratativa: body.tratativa }),
                ...(body.nome && { nome: body.nome }),
                ...(body.telefone !== undefined && { telefone: body.telefone }),
                ...(body.endereco !== undefined && { endereco: body.endereco }),
                ...(body.motivo && { motivo: body.motivo }),
                ...(body.atendimento && { atendimento: body.atendimento }),
                ...(body.data && { data: new Date(`${body.data}T00:00:00.000Z`) }),
            },
        });
        return {
            sucesso: true,
            mensagem: 'Atendimento atualizado com sucesso.',
            agendamento: agendamentoAtualizado,
        };
    }
    async criarPeloAdmin(body) {
        if (!body.nome || !body.motivo || !body.data) {
            throw new common_1.BadRequestException('Nome, motivo e data são obrigatórios.');
        }
        const novo = await this.prisma.agendamentos.create({
            data: {
                nome: body.nome.trim(),
                email: body.email ? body.email.trim() : null,
                telefone: body.telefone ? body.telefone.trim() : null,
                endereco: body.endereco ? body.endereco.trim() : null,
                motivo: body.motivo.trim(),
                status: body.status || 'pedido_pendente',
                atendimento: body.atendimento || 'no_paco',
                tipo_atendimento: body.tipo_atendimento || 'unico',
                data: new Date(`${body.data}T00:00:00.000Z`),
                ...(body.horario && {
                    horario: new Date(`${body.data}T${body.horario.length === 5 ? body.horario + ':00' : body.horario}Z`)
                }),
            },
        });
        return {
            sucesso: true,
            id: novo.id,
            mensagem: 'Agendamento registrado com sucesso.',
        };
    }
    async excluir(id) {
        const agendamento = await this.prisma.agendamentos.findUnique({ where: { id } });
        if (!agendamento)
            throw new common_1.NotFoundException('Agendamento não encontrado.');
        await this.prisma.agendamentos.delete({ where: { id } });
        return { sucesso: true, mensagem: 'Agendamento removido com sucesso.' };
    }
};
exports.AdminAgendamentosController = AdminAgendamentosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('busca')),
    __param(1, (0, common_1.Query)('data')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('atendimento')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAgendamentosController.prototype, "listar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminAgendamentosController.prototype, "atualizarStatus", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAgendamentosController.prototype, "criarPeloAdmin", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminAgendamentosController.prototype, "excluir", null);
exports.AdminAgendamentosController = AdminAgendamentosController = __decorate([
    (0, common_1.UseGuards)(staff_guard_1.StaffGuard),
    (0, common_1.Controller)('admin/agendamentos'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminAgendamentosController);
