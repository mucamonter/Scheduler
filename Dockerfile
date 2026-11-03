FROM node:24-alpine
WORKDIR /app

#Istalar pnpm
RUN npm install -g pnpm

#Ler os arquivos de depencencias e instalar elas
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install 

COPY ./prisma ./prisma/
# link falso só para ter algo e dar tempo de rodar o resto
RUN DATABASE_URL="postgresql://mock:mock@localhost:5432/mock" npx prisma generate

#Criar cache para o pnpm build, pois demora
COPY src/ ./src/
COPY prisma7.config.ts tsconfig.json pnpm-lock.yaml pnpm-workspace.yaml ./
ENV NEXT_DISABLE_SOURCEMAPS=1
ENV NEXT_CPU_COUNT=1
RUN pnpm run build

COPY app/ ./app/

#Copiar os demais


EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && pnpm start:prod"]
