# Bike Segura BC

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white" />
</p>

Aplicativo mobile-first para protecao e rastreamento de bicicletas e equipamentos autopropelidos em Balneario Camboriu, SC.

---

## Funcionalidades

| Tela | Descricao |
|------|-----------|
| **Login/Cadastro** | Autenticacao de usuarios com toggle entre entrar e criar conta |
| **Home** | Dashboard com estatisticas, noticias, menu de navegacao e alerta de emergencia |
| **Meus Equipamentos** | Lista de bikes cadastradas com status de protecao em tempo real |
| **Cadastrar Bicicleta** | Formulario completo com fotos, dados, rastreamento e nota fiscal |
| **Delegacia - Boletim de Ocorrencia** | Redirecionamento para Delegacia Virtual SC com dados do equipamento |
| **Mapa** | Rastreamento em tempo real + Mapa de seguranca de areas (Balneario Camboriu) |
| **Meu Perfil** | Dados pessoais editaveis, opcoes de conta e navegacao |
| **Planos** | Prata (R$150/ano), Ouro (R$300/ano), Diamante (R$450/ano) |
| **Minhas Indicacoes** | Sistema de desconto cumulativo: 10% por indicacao, ate 100% |
| **Lojas Parceiras** | Diretorio de lojas com filtro por categoria e link de redirecionamento |
| **Anuncie Aqui** | Marketplace para venda de equipamentos cadastrados no sistema |

---

## Stack Tecnologico

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion** (animacoes)
- **React Router** (navegacao)
- **Leaflet** (mapas interativos)
- **Lucide React** (icones)

---

## Como rodar localmente

```bash
# Clone o repositorio
git clone https://github.com/seu-usuario/bike-segura-bc.git
cd bike-segura-bc

# Instale as dependencias
npm install

# Rode o servidor de desenvolvimento
npm run dev

# Build para producao
npm run build
```

---

## Estrutura do Projeto

```
src/
  components/       # Componentes reutilizaveis
    AlertaFurtoModal.tsx
    BottomNav.tsx
  context/          # Context API
    BikeContext.tsx
  pages/            # Telas do app
    Login.tsx
    Home.tsx
    MeusEquipamentos.tsx
    CadastrarNovo.tsx
    DelegaciaVirtual.tsx
    Mapa.tsx
    MeuPerfil.tsx
    Planos.tsx
    Indicacoes.tsx
    LojasParceiras.tsx
    AnuncieAqui.tsx
  App.tsx           # Rotas principais
  main.tsx          # Entry point
  index.css         # Estilos globais
public/             # Assets estaticos
```

---

## Configuracao do WhatsApp Business

Para o botao "Emitir Alerta de Furto" funcionar com resposta automatica:

1. Configure **Mensagem de Ausencia** no WhatsApp Business
2. Texto sugerido:

> Recebemos seu alerta de furto/roubo e ja encaminhamos para as forcas de seguranca e para nossa equipe de recuperacao. Envie uma foto do seu equipamento o mais breve possivel para auxiliar na recuperacao!

---

## Licenca

Este projeto e de propriedade exclusiva do Bike Segura BC.
