# Açaideira — Pedidos online com montador de copo, Pix automático e painel em tempo real

Site de pedidos da **Açaideira Sorvete & Açaí** (Novo Gama-GO): o cliente monta o açaí camada por camada, paga com Pix ou cartão pelo Mercado Pago e acompanha o pedido ao vivo. A loja recebe tudo num painel em tempo real, com etapas validadas pelo sistema.

## O que o sistema faz

**Para o cliente**
- Montador de copo visual: tamanho, sabor, recheio do meio, complementos, extras e cobertura, com o copo desenhado em camadas e corte "ver por dentro".
- Cardápio pronto com tamanhos e preços.
- Checkout com entrega ou retirada, validação de bairro atendido, horário de funcionamento e pedido mínimo.
- Pagamento: Pix online (QR do Mercado Pago com confirmação automática), cartão online (Checkout do Mercado Pago) ou na entrega (maquininha, Pix ou dinheiro com troco).
- Página "Acompanhe seu pedido" com as etapas ao vivo, código de entrega e botão de ajuda.

**Para a loja**
- Painel com login, pedidos chegando em tempo real com alerta sonoro.
- Fluxo por etapas: aguardando pagamento → confirmado → em produção → saiu/pronto → entregue.
- Mensagens prontas para o WhatsApp do cliente em cada etapa.
- Entrega só é finalizada com o código de 4 dígitos que o cliente informa ao motoboy.
- Abrir/fechar a loja (automático pelo horário ou manual).
- Resumo do dia: faturamento, ticket médio, formas de pagamento e mais vendidos.

## Regras que evitam erro humano
- **Preço recalculado no servidor** a partir do catálogo (`public/js/catalogo.js`), nunca o enviado pelo navegador.
- **Pagamento confirmado pelo Mercado Pago**: o webhook consulta o pagamento na API e só confirma se o valor bate com o pedido.
- **Pix não pago em 15 minutos** é cancelado automaticamente.
- **Histórico de cada mudança de etapa** (quem e quando) na tabela `pedido_eventos`, gravado por trigger.
- **Segurança no banco (RLS)**: dados de clientes só são visíveis para a equipe autenticada.

## Arquitetura

```
Cliente (navegador) ──► Railway: Node/Express (site + API) ──► Supabase (Postgres, Auth, Realtime)
                                     │  ▲
                                     ▼  │ webhook
                                Mercado Pago (Pix e cartão)
Painel da loja ──► Supabase Auth + Realtime (RLS: só a equipe)
```

| Pasta/arquivo | Função |
|---|---|
| `server.js` | API: configuração da loja, criação de pedido com validação, Mercado Pago, webhook, acompanhamento e expiração de Pix |
| `public/index.html` | Site, montador de copo, checkout e área da loja |
| `public/js/catalogo.js` | Catálogo e cálculo de preço, compartilhado entre navegador e servidor |
| `public/js/online.js` | Liga o modo online: pedido no banco, pagamento, acompanhamento e painel em tempo real |

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta do Supabase (só no servidor) |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase (usada no painel) |
| `MP_ACCESS_TOKEN` | Access Token de produção do Mercado Pago (opcional) |
| `PUBLIC_URL` | Endereço público do site, usado no webhook do Mercado Pago |

## Rodar localmente

```bash
npm install
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_PUBLISHABLE_KEY=... npm start
```

## Tecnologias
Node.js · Express · Supabase (PostgreSQL, Auth, Realtime, RLS) · Mercado Pago API · Railway · HTML/CSS/JS sem framework · SVG animado.
