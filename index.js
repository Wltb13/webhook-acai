const express = require('express');
const app = express();
app.use(express.json());

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

// Pedidos por sessão (evita misturar pedidos de diferentes usuários)
const pedidosPorSessao = {};

app.get('/webhook', (req, res) => {
  res.send('🚀 Bot Açaí rodando com sucesso!');
});

app.post('/webhook', (req, res) => {
  // Identificador de sessão
  const sessionId = req.body.session || req.body.sessionId || 'default';
  if (!pedidosPorSessao[sessionId]) {
    pedidosPorSessao[sessionId] = [];
  }
  let pedidos = pedidosPorSessao[sessionId];

  const intent = req.body.queryResult?.intent?.displayName;
  const params = req.body.queryResult?.parameters || {};
  const textoUsuario = req.body.queryResult?.queryText?.toLowerCase() || '';

  let resposta = 'Pedido recebido! 🍧';

  // Saudação - reinicia pedidos da sessão
  if (intent === '01_Saudacao') {
    pedidosPorSessao[sessionId] = [];
    resposta = 'Olá! 👋 Seja bem-vindo ao nosso delivery de Açaí!\n\nMe diga o tamanho que deseja:\n🥤 300ml – R$10\n🥤 500ml – R$15\n🥤 700ml – R$20';

  // Selecionar Tamanho
  } else if (intent === '02_Selecionar_Tamanho') {
    const tamanho = params.tamanho_acai || textoUsuario.match(/(300ml|500ml|700ml)/)?.[0];
    if (!tamanho) {
      resposta = 'Por favor, informe o tamanho do açaí (300ml, 500ml ou 700ml).';
    } else {
      const novoPedido = { tamanho: tamanho };
      pedidos.push(novoPedido);
      resposta = `Tamanho ${tamanho} anotado! Agora escolha até 3 complementos 🍫 Pode responder com os números (ex: 1, 3, 5) ou os nomes.`;
    }

  // Selecionar Complementos
  } else if (intent === '03_Selecionar_Complementos') {
    let complementos = params.complemento_acai;
    if (Array.isArray(complementos)) {
      complementos = complementos.flatMap(item => item.split(',').map(i => i.trim()));
    } else if (typeof complementos === 'string') {
      complementos = complementos.split(',').map(item => item.trim());
    } else if (complementos) {
      complementos = [String(complementos)];
    } else {
      complementos = [];
    }

    // Limita a 3 complementos
    complementos = complementos.slice(0, 3);

    const traduzidos = complementos.map(item => {
      const chave = item.trim();
      if (mapaComplementos[chave]) {
        return mapaComplementos[chave];
      } else {
        const encontrado = Object.values(mapaComplementos).find(c =>
          c.toLowerCase() === chave.toLowerCase()
        );
        return encontrado || chave;
      }
    });

    if (pedidos.length > 0) {
      pedidos[pedidos.length - 1].complementos = traduzidos;
    }

    resposta = `Complementos anotados: ${traduzidos.join(', ')} 😋 Você gostaria de montar mais um açaí? (Sim ou Não)`;

  // Confirmar Novo Açaí
  } else if (intent === '08_Confirmar_Novo_Acai') {
    // Normaliza texto para melhor comparação
    const textoNormalizado = textoUsuario.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const confirmacao = params.confirmacao?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || textoNormalizado;

    if (confirmacao.includes('sim')) {
      resposta = 'Beleza! Vamos montar outro açaí 🍧 Qual tamanho você deseja? 🥤';
    } else if (confirmacao.includes('nao')) {
      resposta = 'Certo! 💰 Qual será a forma de pagamento? (Pix ou Dinheiro)';
    } else {
      resposta = 'Desculpe, não entendi. Você gostaria de montar outro açaí? (Sim ou Não)';
    }

  // Pagamento
  } else if (intent === '04_Pagamento') {
    if (pedidos.length > 0) {
      const pagamento = params.pagamento || textoUsuario.match(/pix|dinheiro/)?.[0] || 'não informado';
      pedidos[pedidos.length - 1].pagamento = pagamento;
    }
    resposta = 'Pagamento anotado! 🧾 Agora me diga o endereço completo para a entrega. 🏠';

  // Endereço
  } else if (intent === '07_Endereco') {
    if (pedidos.length > 0) {
      const endereco = params.endereco || textoUsuario || 'não informado';
      pedidos[pedidos.length - 1].endereco = endereco;
    }

    const resumo = pedidos.map((p, i) => (
      `🍧 Pedido ${i + 1}:\n` +
      `🥤 Tamanho: ${p.tamanho || 'não informado'}\n` +
      `🍫 Complementos: ${Array.isArray(p.complementos) ? p.complementos.join(', ') : 'não informado'}\n` +
      `💰 Pagamento: ${p.pagamento || 'não informado'}\n` +
      `🏠 Endereço: ${p.endereco || 'não informado'}`
    )).join('\n\n');

    resposta = `🧾 Resumo do seu pedido:\n\n${resumo}\n\n✅ Tudo certo! Obrigado por comprar com a gente 🍧🚀`;
  }

  res.json({ fulfillmentText: resposta });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
