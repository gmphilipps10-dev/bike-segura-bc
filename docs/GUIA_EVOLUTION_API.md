# Guia de Configuração - Evolution API (WhatsApp)

Este guia explica como configurar a integração automática do WhatsApp para extrair furtos de bicicletas do grupo e registrar no mapa da Área Segura.

---

## O que foi configurado

O sistema agora possui:
- **Evolution API** rodando em Docker (porta 8080)
- **Webhook** que recebe mensagens automaticamente (`/api/webhook/evolution`)
- **Parser inteligente** que extrai endereço, bairro, marca, cor, data e hora
- **Geocoding** que converte o endereço em coordenadas no mapa
- **Fallback** para bairro quando o endereço específico não é encontrado

---

## Pré-requisitos

- [ ] Ter o número do WhatsApp do Bike Segura disponível
- [ ] A DigitalOcean App Platform rodando o backend
- [ ] Acesso ao painel da DigitalOcean

---

## Passo 1: Adicionar a Evolution API no App da DigitalOcean

### Opção A: Usando Docker Compose (recomendado)

1. Acesse o painel da DigitalOcean: https://cloud.digitalocean.com/apps
2. Clique no app **bike-segura-bc**
3. Vá em **Settings** > **App-Level Environment Variables**
4. Adicione estas variáveis:
   ```
   EVOLUTION_API_KEY=bike-segura-bc-2024
   WEBHOOK_BASE_URL=https://<SEU-DOMINIO>.ondigitalocean.app
   ```
5. No arquivo `docker-compose.yml` já criado, o serviço `evolution` está configurado

### Opção B: Adicionando como serviço separado (se não usar Docker Compose)

1. No painel da DigitalOcean, clique em **Create** > **Apps**
2. Selecione **Docker Hub** como fonte
3. Use a imagem: `atendai/evolution-api:latest`
4. Configure as variáveis de ambiente:
   ```
   AUTHENTICATION_API_KEY=bike-segura-bc-2024
   AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
   DATABASE_ENABLED=true
   DATABASE_CONNECTION_URI=<SUA-MONGODB-URI>
   DATABASE_CONNECTION_DB_PREFIX_NAME=evolution
   DATABASE_SAVE_DATA_INSTANCE=true
   DATABASE_SAVE_DATA_NEW_MESSAGE=true
   WEBHOOK_GLOBAL_ENABLED=true
   WEBHOOK_GLOBAL_URL=https://<SEU-DOMINIO>.ondigitalocean.app/api/webhook/evolution
   WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
   WEBHOOK_EVENTS_MESSAGES_UPSERT=true
   CONFIG_SESSION_PHONE_CLIENT=BikeSeguraBC
   ```
5. Deploy

---

## Passo 2: Acessar o Painel da Evolution API

1. Após o deploy, acesse: `https://<SEU-DOMINIO>:8080/manager`
   - Ou se configurou como serviço separado: `https://evolution-<SEU-APP>.ondigitalocean.app/manager`
2. Faça login com a API Key: `bike-segura-bc-2024`

---

## Passo 3: Criar e Conectar a Instância

### Via Painel Web:
1. Clique em **"Nova Instância"**
2. Nome: `bike-segura-bc`
3. Selecione **WhatsApp Business** como tipo
4. Um **QR Code** será gerado
5. Com o celular do Bike Segura, abra o WhatsApp > Configurações > WhatsApp Web > Escanear QR Code
6. Pronto! O número está conectado

### Via API (alternativo):
```bash
curl -X POST https://<SEU-DOMINIO>/api/webhook/evolution/instancia \
  -H "Content-Type: application/json" \
  -d '{"nome": "bike-segura-bc"}'
```

Depois para conectar (gerar QR):
```bash
curl -X POST https://<SEU-DOMINIO>/api/webhook/evolution/conectar/bike-segura-bc
```

---

## Passo 4: Adicionar ao Grupo de Furtos

1. No celular do Bike Segura, peça para alguém do grupo adicionar o número
2. Ou adicione você mesmo pelo WhatsApp do Bike Segura
3. **Importante**: O número do Bike Segura precisa estar no grupo onde os furtos são reportados

---

## Como Funciona (Automático)

A partir do momento que o número está conectado e no grupo:

```
1. Alguém manda mensagem de furto no grupo
   "Roubaram minha bike Caloi azul na Av. Brasil, Barra Norte, ontem as 20h30"

2. A Evolution API captura a mensagem

3. Envia para o webhook do Bike Segura (/api/webhook/evolution)

4. O parser extrai:
   - Endereço: "Av. Brasil, Barra Norte"
   - Bairro: "Barra Norte"
   - Marca: "Caloi"
   - Cor: "Azul"
   - Data: ontem às 20:30
   - Tipo: Bicicleta

5. Geocoding converte para coordenadas no mapa

6. Salva no MongoDB como ocorrência

7. Aparece automaticamente no Mapa > Área Segura
```

---

## Exemplos de Mensagens que Funcionam

```
"Furto de bike Trek azul na Av. Brasil, Barra Norte, ontem as 20h30"
"Roubaram minha Caloi vermelha em frente ao P12, Centro, hoje as 15h"
"Perdi minha bike na rua Aqueduto, Vilas, 14/06 as 19h"
"Subtraíram minha Specialized preta na Av. Atlântica, por volta das 22h"
"Levaram minha bike na 4ª Avenida, Pioneiros, anteontem"
```

---

## Monitoramento

### Verificar status da conexão:
```bash
curl https://<SEU-DOMINIO>/api/webhook/evolution/status
```

### Ver logs no painel da DigitalOcean:
1. Acesse cloud.digitalocean.com/apps
2. Clique no componente **evolution**
3. Aba **Runtime Logs**

---

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| QR Code não aparece | Recarregue a página ou recrie a instância |
| Mensagens não chegam | Verifique se o webhook URL está correto nas variáveis |
| Ocorrências não aparecem no mapa | Verifique os logs do backend na DigitalOcean |
| Número desconectou | Escanear QR Code novamente (válido por ~20 dias) |
| "Instância não encontrada" | Verifique o nome: deve ser "bike-segura-bc" |

---

## Segurança

- A API Key da Evolution está configurada como `bike-segura-bc-2024`
- Recomendamos mudar para uma senha mais forte em produção
- O webhook só aceita mensagens da Evolution API (origem confiável)
- Mensagens do próprio bot são ignoradas (evita loop)
- Apenas mensagens com palavras-chave de furto são processadas

---

## Limitações

- O WhatsApp Web precisa estar conectado (número não pode ficar offline)
- O QR Code precisa ser renovado a cada ~20 dias
- A Evolution API é não-oficial (existe pequeno risco de banimento)
- O geocoding depende do Nominatim (OpenStreetMap)

---

## Suporte

Em caso de dúvidas ou problemas, verifique:
1. Logs do backend na DigitalOcean
2. Logs da Evolution API
3. Documentação oficial: https://doc.evolution-api.com
