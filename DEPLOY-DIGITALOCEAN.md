# Publicacao segura na DigitalOcean

Este roteiro evita colocar senhas dentro do codigo.

## 1. Antes de publicar

1. Faça backup do banco MongoDB.
2. Confirme que o site atual está funcionando.
3. Não apague o serviço atual antes do novo deploy terminar.

## 2. Variaveis do backend

Na DigitalOcean, abra o aplicativo e entre em:

`Settings` > componente do backend > `Environment Variables`

Cadastre as variaveis listadas em `backend/.env.example`.

Marque como secretas:

- `MONGODB_URI`
- `JWT_SECRET`
- `QR_SALT`
- `PAINEL_SENHA`
- `ADMIN_PIN`
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`

Taxas de cartao usadas para repassar os encargos ao cliente (opcionais; os
valores abaixo ja sao os padroes do sistema):

- `ASAAS_CARD_FIXED_FEE_CENTS=49`
- `ASAAS_CARD_FEE_1X=0.0299`
- `ASAAS_CARD_FEE_2_6X=0.0349`
- `ASAAS_CARD_FEE_7_12X=0.0399`
- `ASAAS_CARD_FEE_13_21X=0.0429`

Se o Asaas conceder taxas promocionais ou personalizadas, atualize estas
variaveis para que o encargo exibido ao cliente corresponda exatamente a taxa
da conta.
- `VAPID_PRIVATE_KEY`

Use:

`CORS_ORIGINS=https://www.bikesegurabc.com.br,https://bikesegurabc.com.br,https://forcasdeseguranca.bikesegurabc.com.br`

O subdominio institucional `forcasdeseguranca.bikesegurabc.com.br` deve apontar
para o mesmo app do frontend. Na DigitalOcean, adicione esse dominio em
`Settings/Networking > Domains` do app. Se o DNS nao for gerenciado pela
DigitalOcean, crie um CNAME `forcasdeseguranca` apontando para o alias
`ondigitalocean.app` exibido pela propria DigitalOcean.

Mantenha:

`ENABLE_ADMIN_PROMOTION=false`

## 3. Variavel do frontend e admin

Cadastre durante o build:

`VITE_API_BASE_URL=/bike-segura-bc-backend/api`

## 4. Webhook do Asaas

No Asaas, configure o mesmo valor usado em `ASAAS_WEBHOOK_TOKEN`.

Endpoint:

`https://www.bikesegurabc.com.br/bike-segura-bc-backend/api/pagamentos/webhook`

Envie o token pelo campo de autenticacao do webhook.

## 5. Health check

Configure o monitoramento do backend para:

`/api/health`

Resposta esperada:

`{"status":"OK","mongodb":"connected"}`

## 6. Depois do deploy

Teste nesta ordem:

1. Abrir o site.
2. Fazer login como usuario comum.
3. Consultar os equipamentos do usuario.
4. Abrir um QR publico.
5. Entrar no painel administrativo.
6. Confirmar que clientes, equipamentos e adesivos carregam.
7. Criar uma cobranca de teste no sandbox do Asaas antes de usar producao.

Se algum teste falhar, use o rollback da DigitalOcean para voltar ao deploy anterior.
