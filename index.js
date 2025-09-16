const express = require('express');
const app = express();
app.use(express.json());

// Serve arquivos estáticos como painel.html
app.use(express.static(__dirname));

// Pedidos em memória (não salva em arquivo)
let pedidosMemoria = [];

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

// Função para calcular preço por tamanho
function calcularPreco(tamanho) {
  if (!tamanho) return 0;
  const t = tamanho.toLowerCase();
  if (t.includes('300')) return 10;
  if (t.includes('500')) return 15;
  if (t.includes('700')) return 20;
  return 0;
}

// Pedidos por sessão (para montagem do cliente)
const pedidosPorSessao = {};

app.get('/webhook', (req, res) => {
  res.send('🚀 Bot Açaí rodando com sucesso!');
});

function getComplementosLista() {
  return Object.entries(mapaComplementos)
    .map(([num, nome]) => `${num} - ${nome}`)
    .join('\n');
}

// ==================================================
// WEBHOOK PRINCIPAL (Dialogflow)
// ==================================================
app.post('/webhook', (req, res) => {
  try {
    const sessionId = req.body.session || req.body.sessionId || 'default';
    if (!pedidosPorSessao[sessionId]) {
      pedidosPorSessao[sessionId] = [];
    }
    let pedidos = pedidosPorSessao[sessionId];

    const intent = req.body.queryResult?.intent?.displayName;
    const params = req.body.queryResult?.parameters || {};
    const textoUsuario = req.body.queryResult?.queryText?.toLowerCase() || '';

    let resposta = 'Pedido recebido! 🍧';

    if (intent === '01_Saudacao') {
      pedidosPorSessao[sessionId] = [];
      resposta = 'Olá! 👋 Seja bem-vindo ao nosso delivery de Açaí!\n\nMe diga o tamanho que deseja:\n🥤 300ml – R$10\n🥤 500ml – R$15\n🥤 700ml – R$20';

    } else if (intent === '02_Selecionar_Tamanho') {
      const tamanho = params.tamanho_acai || textoUsuario.match(/(300ml|500ml|700ml)/)?.[0];
      if (!tamanho) {
        resposta = 'Por favor, informe o tamanho do açaí (300ml, 500ml ou 700ml).';
      } else {
        const novoPedido = { tamanho: tamanho };
        pedidos.push(novoPedido);
        resposta =
          `Tamanho ${tamanho} anotado!\n\nAgora escolha até 3 complementos 🍫 \n${getComplementosLista()}\nPode responder com os números (ex: 1, 3, 5) ou os nomes.`;
      }

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

      complementos = complementos.slice(0, 3);

      const traduzidos = complementos.map(item => {
        const chave = item.trim();
        if (mapaComplementos[chave]) {
          return mapaComplementos[chave];
        } else {
          const encontrado = Object.values(mapaComplementos).find(c =>
            c.toLowerCase() === chave.toLowerCase()
          );
          return encontrado || item;
        }
      });

      if (pedidos.length > 0) {
        pedidos[pedidos.length - 1].complementos = traduzidos;
      } else {
        resposta = 'Por favor, selecione o tamanho do açaí antes de escolher os complementos.';
        return res.json({ fulfillmentText: resposta });
      }

      resposta = `Complementos anotados: ${traduzidos.join(', ')} 😋 Você gostaria de montar mais um açaí? (Sim ou Não)`;

    } else if (intent === '08_Confirmar_Novo_Acai') {
      const textoNormalizado = textoUsuario.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const confirmacao = params.confirmacao?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || textoNormalizado;

      if (confirmacao.includes('sim')) {
        resposta = 'Beleza! Vamos montar outro açaí 🍧 Qual tamanho você deseja? 🥤';
      } else if (confirmacao.includes('nao')) {
        resposta = 'Certo! 💰 Qual será a forma de pagamento? (Pix ou Dinheiro)';
      } else {
        resposta = 'Desculpe, não entendi. Você gostaria de montar outro açaí? (Sim ou Não)';
      }

    } else if (intent === '04_Pagamento') {
      if (pedidos.length > 0) {
        const pagamento = params.pagamento || textoUsuario.match(/pix|dinheiro/)?.[0];
        if (!pagamento) {
          resposta = 'Por favor, informe Pix ou Dinheiro como forma de pagamento.';
          return res.json({ fulfillmentText: resposta });
        }
        pedidos[pedidos.length - 1].pagamento = pagamento;

        if (pagamento.toLowerCase() === 'dinheiro') {
          resposta = 'Pagamento anotado! 💵 Você vai precisar de troco para quanto? Se não precisar, pode responder "não preciso de troco".';
        } else {
          resposta = 'Pagamento anotado! 🧾 Agora me diga o endereço completo para a entrega. 🏠';
        }
      } else {
        resposta = 'Você precisa montar um pedido antes de escolher o pagamento.';
      }

    } else if (intent === '10_Troco_Sim' || intent === '09_Troco_Nao') {
      if (pedidos.length > 0) {
        let troco = params.troco || textoUsuario || '';
        if (intent === '09_Troco_Nao') {
          troco = 'Não preciso de troco';
        }
        pedidos[pedidos.length - 1].troco = troco;
      } else {
        resposta = 'Você precisa montar um pedido antes de informar o troco.';
      }
      resposta = 'Troco anotado! Agora me diga o endereço completo para a entrega. 🏠';

    } else if (intent === '07_Endereco') {
      if (pedidos.length > 0) {
        const endereco = params.endereco || textoUsuario || 'Não informado';
        pedidos[pedidos.length - 1].endereco = endereco;
      } else {
        resposta = 'Você precisa montar um pedido antes de informar o endereço.';
        return res.json({ fulfillmentText: resposta });
      }

      const ultimoPedido = pedidos[pedidos.length - 1] || {};
      const pagamento = ultimoPedido.pagamento || '⚠️ Não informado';
      const enderecoFinal = ultimoPedido.endereco || '⚠️ Não informado';
      const total = pedidos.reduce((soma, p) => soma + calcularPreco(p.tamanho), 0);

      const novoPedido = {
        id: pedidosMemoria.length > 0 ? pedidosMemoria[pedidosMemoria.length - 1].id + 1 : 1,
        cliente: req.body.queryResult?.outputContexts?.[0]?.parameters?.nome || "Não informado",
        itens: pedidos.map(p => ({
          tamanho: p.tamanho,
          complementos: p.complementos || []
        })),
        pagamento,
        troco: ultimoPedido.troco || "Não informado",
        endereco: enderecoFinal,
        total,
        status: "Pendente",
        horario: new Date().toISOString()
      };

      pedidosMemoria.push(novoPedido);

      const resumoPedidos = pedidos.map((p, i) =>
        '------------------------------------------\n' +
        `🍧 Pedido ${i + 1}\n` +
        `🥤 Tamanho: ${p.tamanho || '⚠️ Não informado'}\n` +
        `🍫 Complementos:\n${
          Array.isArray(p.complementos) && p.complementos.length > 0
            ? p.complementos.map(c => `   - ${c}`).join('\n')
            : '   ⚠️ Não informado'
        }`
      ).join('\n');

      resposta =
        `🧾 Resumo do seu pedido (Total: ${pedidos.length})\n\n` +
        `${resumoPedidos}\n` +
        '------------------------------------------\n' +
        `💰 Pagamento: ${pagamento}\n` +
        `🏠 Endereço: ${enderecoFinal}\n` +
        `💸 Total a pagar: R$${total},00\n\n` +
        '✅ Tudo certo! Obrigado por comprar com a gente 🍧🚀\nEm breve entraremos em contato para finalizar seu pedido!';

      pedidosPorSessao[sessionId] = [];
    }

    res.json({ fulfillmentText: resposta });
  } catch (error) {
    res.status(500).json({ fulfillmentText: 'Ocorreu um erro inesperado. Tente novamente.' });
  }
});

// ==================================================
// NOVA ROTA: LISTAR PEDIDOS PARA O PAINEL
// ==================================================
app.get('/pedidos', (req, res) => {
  res.json(pedidosMemoria.filter(p => p.status === "Pendente"));
});

// ==================================================
// NOVA ROTA: FINALIZAR PEDIDO
// ==================================================
app.post('/finalizar', (req, res) => {
  try {
    const { id } = req.body;
    pedidosMemoria = pedidosMemoria.map(p =>
      p.id === id ? { ...p, status: "Finalizado" } : p
    );
    res.json({ success: true, message: `Pedido ${id} finalizado!` });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erro interno" });
  }
});

// ==================================================
// INICIAR SERVIDOR
// ==================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
