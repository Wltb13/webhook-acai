const express = require('express');
const app = express();
app.use(express.json());

// Rota de teste no navegador
app.get('/webhook', (req, res) => {
  res.send('Servidor do Bot_Açaí está ativo!');
});

// Mapa de complementos
const mapaComplementos = {
  '1': 'Banana',
  '2': 'Morango',
  '3': 'Leite condensado',
  '4': 'Chocolate',
  '5': 'Granola',
  '6': 'Paçoca',
  '7': 'Leite ninho',
  '8': 'Nutella',
  '9': 'Kiwi',
  '10': 'Coco ralado'
};

let pedidos = [];
let aguardandoNovoPedido = false;

app.post('/webhook', (req, res) => {
  const intent = req.body.queryResult?.intent?.displayName;
  const params = req.body.queryResult?.parameters;
  let resposta = 'Pedido recebido! 🍧';

  if (intent === '01_Saudacao') {
    resposta = 'Olá! 👋 Seja bem-vindo ao nosso delivery de Açaí! Vamos montar seu pedido. Qual tamanho você deseja? 🥤 300ml, 500ml ou 700ml';
    aguardandoNovoPedido = false;

  } else if (intent === '02_Selecionar_Tamanho') {
    const novoPedido = { tamanho: params.tamanho_acai };
    pedidos.push(novoPedido);
    resposta = `Tamanho ${params.tamanho_acai} anotado! Agora escolha até 3 complementos 🍫 Pode responder com os números (ex: 1, 3, 5) ou os nomes.`;

  } else if (intent === '03_Selecionar_Complementos') {
    let complementos = params.complemento_acai;

    if (typeof complementos === 'string') {
      complementos = complementos.split(',').map(item => item.trim());
    } else if (!Array.isArray(complementos)) {
      complementos = [String(complementos)];
    }

    const traduzidos = complementos.map(item => {
      const chave = item.trim().toLowerCase();
      return mapaComplementos[chave] || item;
    });

    if (pedidos.length > 0) {
      pedidos[pedidos.length - 1].complementos = traduzidos;
    }

    aguardandoNovoPedido = true;
    resposta = `Complementos anotados: ${traduzidos.join(', ')} 😋 Você gostaria de montar mais um açaí? (Sim ou Não)`;

  } else if (intent === '08_Montar_Novo_Acai') {
    const confirmacao = params.confirmacao?.toLowerCase();

    if (confirmacao === 'sim') {
      resposta = 'Beleza! Vamos montar outro açaí 🍧 Qual tamanho você deseja? 🥤';
      aguardandoNovoPedido = false;
    } else {
      resposta = 'Certo! 💰 Qual será a forma de pagamento? (Pix ou Dinheiro)';
      aguardandoNovoPedido = false;
    }

  } else if (intent === '04_Pagamento') {
    if (pedidos.length > 0) {
      pedidos[pedidos.length - 1].pagamento = params.pagamento || 'não informado';
    }
    resposta = 'Pagamento anotado! 🧾 Agora me diga o endereço completo para a entrega. 🏠';

  } else if (intent === '07_Endereco') {
    if (pedidos.length > 0) {
      pedidos[pedidos.length - 1].endereco = params.endereco || 'não informado';
    }

    if (pedidos.length === 1) {
      const p = pedidos[0];
      resposta = `🧾 Resumo do seu pedido:\n` +
                 `🥤 Tamanho: ${p.tamanho}\n` +
                 `🍫 Complementos: ${p.complementos?.join(', ') || 'não informado'}\n` +
                 `💰 Pagamento: ${p.pagamento || 'não informado'}\n` +
                 `🏠 Endereço: ${p.endereco || 'não informado'}\n\n` +
                 `✅ Pedido confirmado! Obrigado por comprar com a gente 🍧🚀`;
    } else {
      const resumo = pedidos.map((p, i) => {
        return `🍧 Pedido ${i + 1}:\n` +
               `🥤 Tamanho: ${p.tamanho}\n` +
               `🍫 Complementos: ${p.complementos?.join(', ') || 'não informado'}\n` +
               `💰 Pagamento: ${p.pagamento || 'não informado'}\n` +
               `🏠 Endereço: ${p.endereco || 'não informado'}`;
      }).join('\n\n');

      resposta = `🧾 Resumo dos seus pedidos:\n\n${resumo}\n\n✅ Tudo certo! Obrigado por comprar com a gente 🍧🚀`;
    }
  }

  res.json({ fulfillmentText: resposta });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
