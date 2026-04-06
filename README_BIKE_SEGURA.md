# 🚴‍♂️ BIKE SEGURA BC - Sistema de Segurança e Recuperação de Bicicletas

## 📱 Sobre o Projeto

O **BIKE SEGURA BC** é um aplicativo mobile desenvolvido em React Native/Expo que atua como central de organização e resposta rápida para casos de furto de bicicletas. O app não substitui a polícia, mas funciona como sistema de apoio e inteligência.

## ✨ Funcionalidades Implementadas (MVP)

### 🔐 Autenticação
- ✅ Cadastro completo de usuários (nome, CPF, data nascimento, telefone, email, senha)
- ✅ Login com email e senha
- ✅ Autenticação JWT
- ✅ Validação de dados e formatação automática (CPF, telefone, data)

### 🚲 Gestão de Bicicletas
- ✅ Cadastro completo de bicicletas com:
  - Marca, modelo, cor, número de série
  - Tipo (Urbana, MTB, Speed, Elétrica)
  - Valor estimado
  - Características únicas
  - **Mínimo 3 fotos** (armazenadas em base64)
  - Link de rastreamento externo
- ✅ Listagem de todas as bicicletas cadastradas
- ✅ Visualização detalhada de cada bike
- ✅ Edição e exclusão de bikes
- ✅ Status das bikes (Ativa, Furtada, Recuperada)

### 🚨 Alerta de Furto (Funcionalidade Crítica)
- ✅ **Botão de emergência** destacado na tela inicial e detalhes
- ✅ Confirmação antes de acionar (evita acionamento acidental)
- ✅ Ao acionar:
  - Marca a bike como "FURTADA"
  - Registra data e hora do furto
  - Exibe o link de rastreamento cadastrado
  - Permite compartilhamento rápido das informações
- ✅ Acesso rápido ao rastreamento para bikes furtadas

### 🗺️ Integração com Rastreamento
- ✅ Campo para cadastro de link de rastreamento (AirTag, Find My Device, GPS)
- ✅ Abertura do link de rastreamento direto no app
- ✅ O app **não rastreia diretamente** - funciona como ponte para plataformas oficiais

## 🏗️ Arquitetura

### Backend (FastAPI + MongoDB)
- **API RESTful** com autenticação JWT
- **Modelos:**
  - `User`: dados completos do proprietário
  - `Bike`: informações da bicicleta + fotos em base64
- **Endpoints:** 9 endpoints totalmente funcionais
- **Segurança:** Hash de senhas com bcrypt, validação de acesso

### Frontend (Expo + React Native)
- **Navegação:** Tab-based (Home, Minhas Bikes, Perfil)
- **Telas:** Login, Registro, Lista de Bikes, Detalhes, Cadastro
- **Design:** Interface limpa e intuitiva com foco em UX mobile
- **Permissões:** Acesso à galeria e câmera para fotos

## 🎯 Diferencial Operacional

⚠️ **IMPORTANTE:**
- O BIKE SEGURA BC **NÃO substitui a polícia**
- Atua como **sistema de apoio e inteligência**
- A recuperação depende de **ação conjunta com forças de segurança**
- O rastreamento permanece sob responsabilidade das **plataformas oficiais** (Apple, Google, GPS)

## 🛠️ Tecnologias Utilizadas

### Backend
- FastAPI
- Motor (MongoDB async)
- Python-JOSE (JWT)
- Passlib (Bcrypt)
- Pydantic

### Frontend
- Expo SDK
- React Native
- Expo Router (navegação)
- Expo Image Picker (fotos)
- AsyncStorage (persistência local)
- React Navigation (tabs)
- Date-fns (formatação de datas)

## 🚀 Como Executar

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd /app/frontend
yarn install
yarn start
```

## 📝 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário autenticado

### Bicicletas
- `POST /api/bikes` - Cadastrar bicicleta
- `GET /api/bikes` - Listar bikes do usuário
- `GET /api/bikes/{id}` - Detalhes da bike
- `PUT /api/bikes/{id}` - Atualizar bike
- `DELETE /api/bikes/{id}` - Deletar bike
- `POST /api/bikes/{id}/alert-furto` - **Acionar alerta de furto**

## 🔒 Segurança

- ✅ Senhas com hash bcrypt
- ✅ Autenticação JWT com expiração
- ✅ Validação de propriedade (apenas owner acessa suas bikes)
- ✅ Validação de dados no backend
- ✅ Proteção contra duplicação de CPF/email

## 📊 Status do Projeto

### ✅ Concluído
- [x] Backend completo e testado (9/9 endpoints funcionando)
- [x] Frontend completo (todas as telas implementadas)
- [x] Autenticação completa
- [x] CRUD de bicicletas
- [x] Upload de fotos (base64)
- [x] Botão de alerta de furto
- [x] Integração com links de rastreamento
- [x] Design responsivo e mobile-first

### 🔄 Próximas Melhorias (Fora do MVP)
- [ ] Notificações push
- [ ] Sistema de geofencing
- [ ] Planos de assinatura
- [ ] Painel administrativo
- [ ] Compartilhamento com autoridades
- [ ] Histórico de localizações
- [ ] Social login (Google, Apple)
- [ ] Verificação por SMS

## 👥 Credenciais de Teste

Consulte `/app/memory/test_credentials.md` para credenciais de teste.

## 📱 Telas do App

1. **Login/Registro** - Autenticação completa
2. **Home** - Dashboard com bikes ativas e alertas de furto
3. **Minhas Bikes** - Lista de todas as bikes cadastradas
4. **Cadastrar Bike** - Formulário completo com upload de fotos
5. **Detalhes da Bike** - Visualização completa + botão de alerta
6. **Perfil** - Dados do usuário e configurações

## 🎨 Design System

- **Cores principais:**
  - Verde: #4CAF50 (ações positivas, segurança)
  - Vermelho: #F44336 (alertas, furto)
  - Azul: #2196F3 (rastreamento, info)
- **Tipografia:** System default (iOS/Android)
- **Ícones:** Expo Vector Icons (Ionicons)

## 📄 Licença

Projeto desenvolvido para fins educacionais e de demonstração.

---

**Desenvolvido com ❤️ para proteger ciclistas e suas bikes!** 🚴‍♂️🔒
