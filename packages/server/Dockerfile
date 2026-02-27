FROM node:21-alpine as client

WORKDIR /app/packages/client

COPY ./packages/client/package.json ./

RUN npx pnpm i

COPY ./packages/client/ ./

RUN npm run build

FROM node:21-alpine as server

WORKDIR /app/packages/server

COPY ./packages/server/package.json ./
COPY ./packages/server/pnpm-lock.yaml ./
COPY ./packages/server/prisma ./prisma

RUN npx pnpm i

COPY ./packages/server/ ./

FROM node:21-alpine

WORKDIR /app/packages/server
ENV DATABASE_URL=file:./data/db.sqlite3

COPY --from=server /app/packages/server ./
COPY --from=client /app/packages/client/dist /app/packages/client/dist

RUN mkdir -p /app/packages/server/public/assets/images
RUN ln -s /data /app/packages/server/prisma/data
RUN ln -s /assets /app/packages/server/public/assets

ENTRYPOINT ["npm", "run"]
CMD ["start"]
