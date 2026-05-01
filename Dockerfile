# Define a versão do node js
FROM node:20

# Define o diretório de trabalho do container
WORKDIR /app

# Copiar o arquivo de dependencias pra dentro do container
COPY package.json .

# Instala as dependencias
RUN npm install

# Copia o restante dos arquivos para dentro do container
COPY . . 

RUN npx prisma generate

# Expor a porta 3000, que vai ser a porta usada pela aplicação
EXPOSE 3000

# Define o comando para iniciar a aplicação
CMD ["npm", "start"]