# Usa imagem base do Node
FROM node:18

# Cria diretório de trabalho
WORKDIR /app

# Copia os arquivos do projeto
COPY package*.json ./
RUN npm install
COPY . .

# Expõe a porta usada pelo servidor
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
