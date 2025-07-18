
import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import ytdl from 'ytdl-core'

dotenv.config()

const app = express()
app.use(bodyParser.json())

const TOKEN = process.env.WABA_TOKEN
const PHONE_ID = process.env.WABA_PHONE_ID
const VERIFY_TOKEN = process.env.WABA_VERIFY_TOKEN
const API_URL = process.env.WABA_BASE_URL || 'https://graph.facebook.com/v19.0'

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado!')
    return res.status(200).send(challenge)
  }
  res.sendStatus(403)
})

app.post('/webhook', async (req, res) => {
  const entry = req.body.entry?.[0]
  const changes = entry?.changes?.[0]
  const value = changes?.value
  const messages = value?.messages || []
  for (const msg of messages) await handle(msg)
  res.sendStatus(200)
})

async function handle (msg) {
  const from = msg.from
  const text = msg.text?.body?.trim().toLowerCase() || ''
  const isGroup = msg.context?.group_id || false

  if (text === '/menu' || text === 'menu') return sendMenu(from, isGroup)

  if (msg.type === 'button') {
    const id = msg.button?.payload
    switch (id) {
      case 'btn_vendas': return sendCatalog(from)
      case 'btn_musica': return sendText(from, '🎵 Envie o link do YouTube.')
      case 'btn_yt': return sendText(from, '▶️ Envie o link do vídeo.')
      case 'btn_add': return pending[from] = 'add'
      case 'btn_kick': return pending[from] = 'kick'
      case 'btn_close': return closeGroup(isGroup)
      case 'btn_open': return openGroup(isGroup)
      case 'btn_ajuda': return sendText(from, 'Digite /menu novamente.')
    }
  }

  if (ytdl.validateURL(text)) return downloadAndSendAudio(from, text)

  if (/^\d{11,13}$/.test(text) && pending[from]) {
    const action = pending[from]; delete pending[from]
    if (action === 'add') return addParticipant(isGroup, text)
    if (action === 'kick') return removeParticipant(isGroup, text)
  }
}

const pending = {}

async function sendMenu (to, isGroup) {
  const buttons = [
    { type: 'reply', reply: { id: 'btn_vendas', title: '🛒 Produtos' } },
    { type: 'reply', reply: { id: 'btn_musica', title: '🎵 Baixar Música' } },
    { type: 'reply', reply: { id: 'btn_yt', title: '▶️ Reproduzir YouTube' } }
  ]
  if (isGroup) {
    buttons.push(
      { type: 'reply', reply: { id: 'btn_add', title: '➕ Adicionar' } },
      { type: 'reply', reply: { id: 'btn_kick', title: '➖ Remover' } },
      { type: 'reply', reply: { id: 'btn_close', title: '🔒 Fechar Grupo' } },
      { type: 'reply', reply: { id: 'btn_open', title: '🔓 Abrir Grupo' } }
    )
  }
  buttons.push({ type: 'reply', reply: { id: 'btn_ajuda', title: 'ℹ️ Ajuda' } })
  await axios.post(
    `${API_URL}/${PHONE_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: '*Olá, eu sou o Eliaspk-BOT!* Escolha uma opção:' },
        action: { buttons }
      }
    },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  )
}

async function sendCatalog (to) {
  await sendText(to, '*Produtos*
1️⃣ Produto 1 – R$ 49,90
2️⃣ Produto 2 – R$ 99,90
3️⃣ Produto 3 – R$ 149,90')
}

async function downloadAndSendAudio (to, url) {
  const info = await ytdl.getInfo(url)
  const title = info.videoDetails.title.replace(/[\\/:*?"<>|]/g, '')
  const tmp = `/tmp/${Date.now()}.mp3`
  await new Promise((res, rej) => {
    ytdl(url, { filter: 'audioonly' }).pipe(fs.createWriteStream(tmp)).on('finish', res).on('error', rej)
  })
  const mediaRes = await axios({
    method: 'POST',
    url: `${API_URL}/${PHONE_ID}/media`,
    params: { type: 'audio/mpeg' },
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'audio/mpeg' },
    data: fs.createReadStream(tmp)
  })
  const mediaId = mediaRes.data.id
  await axios.post(`${API_URL}/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'audio',
    audio: { id: mediaId }
  }, { headers: { Authorization: `Bearer ${TOKEN}` } })
  fs.unlinkSync(tmp)
}

async function sendText (to, body) {
  await axios.post(`${API_URL}/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body }
  }, { headers: { Authorization: `Bearer ${TOKEN}` } })
}

// Placeholders para funções de grupo
async function addParticipant (groupId, number) {}
async function removeParticipant (groupId, number) {}
async function closeGroup (groupId) {}
async function openGroup (groupId) {}

app.listen(process.env.PORT || 3000, () => console.log('Bot rodando'))
