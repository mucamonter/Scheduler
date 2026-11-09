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
exports.AgendamentoController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const helpers_1 = require("../common/utils/helpers");
const date_util_1 = require("../common/utils/date.util");
let AgendamentoController = class AgendamentoController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async horariosDisponiveis(data) {
        if (!data || !(0, date_util_1.dataValida)(data))
            throw new common_1.BadRequestException('Data inválida.');
        if (!(0, helpers_1.diaUtil)(data))
            return { horariosOcupados: [], horariosDisponiveis: [] };
        const dataFormatada = new Date(`${data}T00:00:00Z`);
        const slotsOcupados = await this.prisma.agendamento_slots.findMany({
            where: { data: dataFormatada },
            select: { horario_inicio: true }
        });
        const horariosOcupados = slotsOcupados.map(s => s.horario_inicio.toISOString().substring(11, 16));
        const horariosDisponiveis = helpers_1.HORARIOS.filter(h => !horariosOcupados.includes(h));
        return { horariosOcupados, horariosDisponiveis };
    }
    async criarAgendamentoCidadao(body, req) {
        const nome = (body.nome || req.session?.cidadaoNome || '').trim();
        const email = (body.email || req.session?.cidadaoEmail || '').trim().toLowerCase();
        const motivo = (body.motivo || '').trim();
        const dataStr = (body.data || '').trim();
        const horario = (body.horario || '').trim();
        const cidadaoId = req.session?.cidadaoId || req.session?.usuario?.id;
        if (!nome || !motivo || !dataStr || !horario) {
            throw new common_1.BadRequestException('Nome, motivo, data e horário são obrigatórios.');
        }
        if (!(0, date_util_1.dataValida)(dataStr) || dataStr < (0, helpers_1.hoje)() || !(0, helpers_1.diaUtil)(dataStr)) {
            throw new common_1.BadRequestException('Data inválida ou fora do expediente.');
        }
        const dataFormatada = new Date(`${dataStr}T00:00:00Z`);
        const horarioFormatado = horario.length === 5 ? `${horario}:00` : horario;
        const horarioData = new Date(`${dataStr}T${horarioFormatado}Z`);
        try {
            const novoAgendamento = await this.prisma.$transaction(async (tx) => {
                return await tx.agendamentos.create({
                    data: {
                        nome,
                        email: email || null,
                        motivo,
                        data: dataFormatada,
                        horario: horarioData,
                        status: 'pedido_pendente',
                        atendimento: 'marcado',
                        tipo_atendimento: 'unico',
                        ...(cidadaoId && {
                            cidadaos: { connect: { id: cidadaoId } }
                        }),
                        agendamento_slots: {
                            create: [{ data: dataFormatada, horario_inicio: horarioData }]
                        },
                        agendamento_participantes: {
                            create: [{ nome, principal: true }]
                        }
                    }
                });
            });
            return { sucesso: true, id: novoAgendamento.id, mensagem: 'Pedido registrado com sucesso.' };
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new common_1.ConflictException('Este horário acabou de ser preenchido por outro usuário.');
            }
            throw e;
        }
    }
};
exports.AgendamentoController = AgendamentoController;
__decorate([
    (0, common_1.Get)('disponiveis'),
    __param(0, (0, common_1.Query)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgendamentoController.prototype, "horariosDisponiveis", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AgendamentoController.prototype, "criarAgendamentoCidadao", null);
exports.AgendamentoController = AgendamentoController = __decorate([
    (0, common_1.Controller)('agendamentos'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgendamentoController);
