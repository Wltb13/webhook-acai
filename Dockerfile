# Usa imagem oficial do Node.js
FROM node:18.20.2

# Cria diretório de trabalho
WORKDIR /app

# Copia os arquivos do projeto
COPY package*.json ./
COPY . .

# Instala dependências
RUN npm install

# Expoe a porta que o app usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
