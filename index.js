const express = require('express');
const app = express();
app.use(express.json());

const listaComplementos = {
  1: 'Banana',
  2: 'Morango',
  3: 'Leite condensado',
  4: 'Granola',
  5: 'Paçoca',
  6: 'Nutella',
  7: 'Leite em pó',
  8: 'Ovomaltine',
  9: 'Gotas de chocolate',
  10: 'Coco ralado'
};

app.post('/webhook', (req, res) => {
  const intent = req.body.queryResult?.intent?.displayName;
  const params = req.body.queryResult?.parameters;

  console.log('Intent recebida:', intent);
  console.log('Parâmetros:', params);

  let resposta = 'Pedido recebido! 🍧';

  if (intent === '01_Saudacao') {
    resposta = 'Olá! 👋 Seja bem-vindo ao nosso delivery de Açaí! Qual tamanho você deseja? 🥤 300ml, 500ml ou 700ml';

  } else if (intent === '02_Selecionar_Tamanho') {
    resposta = 'Show! Agora escolha até 3 complementos para seu açaí. Pode responder com os números (ex: 1, 3, 5) ou os nomes.';

  } else if (intent === '03_Selecionar_Complementos') {
    let complementos = params.complemento || params.complementos || params.sabores;

    // Garante que seja array
    if (typeof complementos === 'string') {
      complementos = complementos.split(',').map(item => item.trim());
    } else if (!Array.isArray(complementos)) {
      complementos = [String(complementos)];
    }

    // Traduz números para nomes
    const listaFinal = complementos.map(item => {
      const numero = parseInt(item);
      return listaComplementos[numero] || item;
    });

    resposta = `Complementos anotados: ${listaFinal.join(', ')} 😋 Quer montar mais um açaí ou seguir para o pagamento?`;

  } else if (intent === '04_Pagamento') {
    resposta = 'Certo! 💰 Aceitamos Pix ou Dinheiro. Vai precisar de troco?';

  } else if (intent === '05_Confirma_Pagamento') {
    resposta = 'Pagamento confirmado! 🧾 Agora me diga o endereço completo para a entrega. 🏠';

  } else if (intent === '07_Endereco') {
    const endereco = params.endereco || 'Endereço não informado';
    resposta = `Endereço recebido: ${endereco} 🏡 Seu pedido está a caminho!`;

  } else if (intent === '06_Confirmar_Pedido') {
    const tamanho = params.tamanho || 'não informado';
    let complementos = params.complemento || params.complementos || params.sabores;

    if (typeof complementos === 'string') {
      complementos = complementos.split(',').map(item => item.trim());
    } else if (!Array.isArray(complementos)) {
      complementos = [String(complementos)];
    }

    const listaFinal = complementos.map(item => {
      const numero = parseInt(item);
      return listaComplementos[numero] || item;
    });

    const pagamento = params.pagamento || 'não informado';
    const endereco = params.endereco || 'não informado';

    resposta = `🧾 Resumo do seu pedido:\n` +
               `🥤 Tamanho: ${tamanho}\n` +
               `🍫 Complementos: ${listaFinal.join(', ')}\n` +
               `💰 Pagamento: ${pagamento}\n` +
               `🏠 Endereço: ${endereco}\n\n` +
               `Seu pedido está a caminho! Obrigado por comprar com a gente 🍧🚀`;
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
