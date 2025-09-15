const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const intent = req.body.queryResult?.intent?.displayName;
  const params = req.body.queryResult?.parameters;

  console.log('Intent recebida:', intent);
  console.log('Parâmetros:', params);

  let resposta = 'Pedido recebido! 🍧';

  if (intent === '01_Saudacao') {
    resposta = 'Olá! 👋 Seja bem-vindo ao nosso delivery de Açaí! Qual tamanho você deseja? 🥤 300ml, 500ml ou 700ml';
  
  } else if (intent === '02_Selecionar_Tamanho') {
    resposta = 'Show! Agora escolha até 3 complementos para seu açaí. Pode responder com os números ou os nomes.';
  
  } else if (intent === '03_Selecionar_Complementos') {
    const complementos = params.complemento;
    const lista = Array.isArray(complementos)
      ? complementos.join(', ')
      : complementos;
    resposta = `Complementos anotados: ${lista} 😋 Quer montar mais um açaí ou seguir para o pagamento?`;
  
  } else if (intent === '04_Pagamento') {
    resposta = 'Certo! 💰 Aceitamos Pix ou Dinheiro. Vai precisar de troco?';
  
  } else if (intent === '05_Confirma_Pagamento') {
    resposta = 'Pagamento confirmado! 🧾 Agora me diga o endereço completo para a entrega. 🏠';
  
  } else if (intent === '06_Confirmar_Pedido') {
    resposta = 'Pedido fechado! Obrigado por comprar com a gente 🍧🚀';
  
  } else if (intent === '07_Endereco') {
    const endereco = params.endereco || 'Endereço não informado';
    resposta = `Endereço recebido: ${endereco} 🏡 Seu pedido está a caminho!`;
  }

  res.json({ fulfillmentText: resposta });
});

app.get('/', (req, res) => {
  res.send('Servidor do Bot_Açai está ativo!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
