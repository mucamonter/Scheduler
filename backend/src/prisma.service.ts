import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from "@prisma/client";

//mode:
@Injectable()

//Add on AppService those function from Prisma Client
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(){
    const adapter = new PrismaMariaDb({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 5000,
      connectionLimit: 10,
    });


    super({ adapter });
  }

  //Those are alredy programmed
  
  async onModuleInit() {
    await this.$connect();
  }
  
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
