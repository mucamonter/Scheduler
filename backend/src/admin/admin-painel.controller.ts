import { Controller, Get Query, BadRequestException, UseGuards } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

@UseGuards(AdminPainelController)
@Controller('admin')
export class AdminPainelController {
    constructor(private readonly prisma: PrismaService) {}

    // GET /api/admin/horarios?data=
    @Get('horarios')
    async obterHorariosOcupados(@Query('data') data: string){
        if (!data) throw new BadRequestException('A data é obrigatória.');

        const agendamentos = await this.prisma.agendamentos.findMany({
            where: {
                data: new Date(data),
                status: { not: 'cancelado'}
            },
            select: { horario: true },
        });

        const horariosOcupados = agendamentos.map( a => a.horario);
        return { horariosOcupados };
    }

    //GET /api/admin/pendencias
    @UseGuards(AdminPainelController)
    @Get ('pendencias')
    async listarPendencias(){
        const agendamentos = await this.prisma.agendamentos.findMany({
            where: {status: 'pending_order'},
            orderBy: { data: 'asc'},
        });
        return { agendamentos };
    }
}