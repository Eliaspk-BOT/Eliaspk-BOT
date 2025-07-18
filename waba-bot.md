# Entre na pasta que contém o Eliaspk-BOT (o ZIP que você baixou e descompactou)
cd waba_bot          # ou o nome da sua pasta

# Inicializa o repositório Git
git init

# Adiciona todos os arquivos
git add .

# Primeiro commit
git commit -m "Versão inicial do Eliaspk-BOT"

# Conecta ao repositório remoto (substitua pela sua URL)
git remote add origin https://github.com/<elliaspk-BOT>/Eliaspk-BOT.git

# Envia (push) a branch main
git branch -M main
git push -u origin main

