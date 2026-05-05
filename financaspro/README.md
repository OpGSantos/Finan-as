# 💰 FinançasPRO — PWA

Controle financeiro pessoal com Assessor IA, funciona como app no celular.

---

## 🚀 Como colocar no ar (Vercel) — 5 minutos

### Passo 1 — Crie uma conta gratuita
- Acesse **vercel.com** e crie uma conta (pode entrar com Google)

### Passo 2 — Instale o Node.js (se não tiver)
- Baixe em **nodejs.org** → versão LTS

### Passo 3 — Faça o deploy
Abra o terminal na pasta do projeto e rode:

```bash
npm install
npx vercel --prod
```

Siga as instruções do terminal (login, nome do projeto). Em ~2 minutos seu app estará no ar com uma URL como:
`https://financaspro.vercel.app`

---

## 📱 Instalar no celular como app

### iPhone (Safari):
1. Abra a URL do seu app no Safari
2. Toque no ícone de compartilhar (quadrado com seta)
3. Toque em **"Adicionar à Tela de Início"**
4. Toque em **Adicionar**

### Android (Chrome):
1. Abra a URL no Chrome
2. Toque no menu ⋮ (três pontos)
3. Toque em **"Adicionar à tela inicial"**
4. Confirme

O app vai aparecer na tela inicial igual a um app nativo! ✅

---

## 🤖 Configurar o Assessor IA

1. Acesse **console.anthropic.com**
2. Crie uma conta (tem plano gratuito)
3. Vá em **API Keys** → **Create Key**
4. Copie a chave (começa com `sk-ant-...`)
5. No app, vá na aba **✦ IA** → toque em **⚙️ Config**
6. Cole sua API Key e salve

---

## 💾 Dados salvos

Os dados ficam salvos no `localStorage` do navegador/celular — permanecem mesmo fechando o app, reiniciando o celular, ou saindo da internet. Só são apagados se você limpar os dados do site manualmente.

---

## 📁 Estrutura do projeto

```
financaspro/
├── public/
│   ├── index.html      # HTML principal com meta tags PWA
│   ├── manifest.json   # Configuração do PWA (ícone, nome, cores)
│   └── sw.js           # Service Worker (funciona offline)
├── src/
│   ├── index.js        # Entrada do React
│   └── App.js          # App completo
└── package.json
```
