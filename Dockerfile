# Usa imagem base do Node
FROM node:18.20.2

# Cria diretório de trabalho
WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Expõe a porta usada pelo servidor
EXPOSE 3000

# Comando para iniciar o app
CMD ["npm", "start"]
