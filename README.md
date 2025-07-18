
# WABA Bot – Termux (API Oficial)

Chatbot editável em português que usa a **WhatsApp Business Cloud/On‑Premise API** e conecta via SMS (OTP).

## Funcionalidades
- Botões: vendas, baixar música, reproduzir YouTube
- Administração de grupo (add/kick, fechar/abrir) – *placeholders*: implemente conforme seu ambiente
- Código em Node + Express, fácil de modificar

## Passos rápidos
```bash
pkg install -y nodejs git ffmpeg
git clone <repo> waba-bot && cd waba-bot
cp .env.example .env           # preencha tokens
npm install
npm start
```
