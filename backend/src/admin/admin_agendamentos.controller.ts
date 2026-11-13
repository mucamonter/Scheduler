import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, NotFoundException, BadRequestException} from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { StaffGuard } from '../common/guards/staff.guard';


@UseGuards(StaffGuard)


@Controller('admin/agendamentos')
export class AdminAgendamentosController{
    
    //Important for
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    async listar(
        @Query('busca') busca?: string,
        @Query('data') data?: string,
        @Query('status') status?: string,
        @Query('atendimento') atendimento?: string,
    ){
        const where: any = {};

        if(data){
        const inicioDia = new Date(`${data}T00:00:00.000Z`);
        const fimDia = new Date(`${data}T23:59:59.999Z`);
        where.data = { gte: inicioDia, lte: fimDia };
    }
        if (status) {
            where.status = status;
        }

        if(atendimento){
            where.atendimento = atendimento;
        }

        if (busca && busca.trim() !== '') {
            const termo = busca.trim();
            where.OR = [
                { nome: { contains: termo} },
                { email: { contains: termo}},
                { telefone: { contains: termo}},
                { endereco: { contains: termo}},
                { motivo: { contains: termo}},
                { tratativa: { constains: termo }},
            ];
        }



    }

    