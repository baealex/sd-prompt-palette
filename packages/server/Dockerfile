FROM node:21-alpine as client

WORKDIR /app/packages/legacy-client

COPY ./packages/legacy-client/package.json ./
COPY ./packages/legacy-client/pnpm-lock.yaml ./

RUN npx pnpm i

COPY ./packages/legacy-client/ ./

RUN npm run build

FROM node:21-alpine as server

WORKDIR /app/packages/server

COPY ./packages/server/package.json ./
COPY ./packages/server/pnpm-lock.yaml ./

RUN npx pnpm i

COPY ./packages/server/ ./

FROM node:21-alpine

WORKDIR /app/packages/server

COPY --from=server /app/packages/server ./
COPY --from=client /app/packages/legacy-client/dist /app/packages/legacy-client/dist

RUN mkdir -p /app/packages/server/public/assets/images
RUN ln -s /app/packages/server/prisma/data /data
RUN ln -s /app/packages/server/public/assets /assets

ENTRYPOINT ["npm", "run"]
CMD ["start"]
