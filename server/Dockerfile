FROM node:18.16.0

WORKDIR /app

COPY ./src/package.json ./
COPY ./src/package-lock.json ./
COPY ./src/client/package.json ./client/

RUN npm i

COPY ./src/ ./

RUN npm run build:client

RUN mkdir /app/public
RUN mkdir /app/public/assets
RUN ln -s /app/prisma/data /data
RUN ln -s /app/public/assets /assets

ENTRYPOINT ["npm", "run"]
CMD ["start"]
