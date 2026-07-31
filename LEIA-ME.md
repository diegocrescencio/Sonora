# 🎵 Sonora v2 — seu app de música estilo Spotify

App de streaming de música (PWA) que se instala no celular e no computador, agora com **importação de músicas** de dois jeitos: pelo próprio app ou pela pasta `musicas/` do repositório.

---

## 🚀 Publicar no GitHub Pages (passo a passo sem cagada)

1. No GitHub, clique em **New repository**. Nome sugerido: `sonora`. Marque **Public** (Pages grátis exige repositório público). **NÃO** marque "Add a README".
2. Na tela do repositório vazio, clique em **"uploading an existing file"**.
3. ⚠️ **O detalhe que evita o erro clássico:** arraste os arquivos que estão **DENTRO** da pasta `sonora` (index.html, app.js, manifest.json, sw.js, LEIA-ME.md e as pastas `icons` e `musicas`) — e **não** a pasta `sonora` inteira. O `index.html` precisa ficar na **raiz** do repositório. Se você arrastar a pasta, o endereço final ficaria `.../sonora/sonora/` e o app não abriria direito.
4. Clique em **Commit changes** e aguarde o upload terminar.
5. Vá em **Settings → Pages** (menu lateral). Em **Source**, escolha **Deploy from a branch**. Em **Branch**, escolha `main` e a pasta `/ (root)`. Clique **Save**.
6. Aguarde 1 a 3 minutos. O endereço aparece no topo da página Pages: `https://SEU-USUARIO.github.io/sonora/`
7. Abra o link, teste, e instale (instruções abaixo). 🎉

**Para atualizar depois:** edite/substitua os arquivos pelo próprio site do GitHub (botão "Add file" ou o lápis ✏️) e faça commit. Aguarde ~1 min. Se a mudança não aparecer no app instalado, abra `sw.js` e aumente a versão do cache (ex.: `sonora-v2` → `sonora-v3`) antes do commit — isso força o app a baixar tudo de novo.

---

## 📲 Instalar como app

- **Android (Chrome):** abra o link → menu ⋮ → **Instalar app**
- **iPhone (Safari):** abra o link → compartilhar (□↑) → **Adicionar à Tela de Início**
- **PC (Chrome/Edge):** abra o link → ícone de instalação ⊕ na barra de endereço → **Instalar**

---

## 🎶 Como colocar SUAS músicas (2 jeitos, sem mexer em código)

### Jeito 1 — Importar pelo app (mais fácil, salva no aparelho)
No app, toque em **⬆️ Importar músicas** (na Biblioteca, na sidebar, ou no cartão da Home) e escolha os MP3s do seu celular/PC. O app lê automaticamente título, artista e álbum das tags do arquivo e salva tudo no armazenamento do navegador (IndexedDB) — as músicas continuam lá depois de fechar, e tocam **offline**.

- ✅ Zero configuração, funciona na hora
- ⚠️ As músicas ficam só **naquele aparelho/navegador** (não sincronizam entre dispositivos)
- 🗑️ Para apagar: menu ⋯ da música → "Apagar do app"

### Jeito 2 — Pasta `musicas/` no GitHub (disponível em todos os aparelhos)
1. No seu repositório, entre na pasta **musicas/** e faça upload dos seus MP3s (**máx. 100 MB por arquivo** — limite do GitHub; o repositório todo deve ficar de preferência abaixo de ~1 GB).
2. Edite o arquivo **musicas/biblioteca.json** listando cada música (tem um `biblioteca.exemplo.json` pronto para copiar):

```json
{
  "faixas": [
    { "titulo": "Minha Música", "artista": "Meu Nome", "album": "Demos", "arquivo": "musicas/minha-musica.mp3" }
  ]
}
```

3. Commit. Recarregue o app: as faixas aparecem em **Suas Músicas** em qualquer aparelho que abrir o link.

Campos opcionais por faixa: `"cor1"`, `"cor2"` (cores da capa em hex) e `"emoji"` (ícone da capa).

### E sincronizar com uma playlist do Spotify/YouTube?
Não é possível puxar o **áudio** desses serviços — as faixas são protegidas por DRM e os termos de uso proíbem. Use arquivos que você possui (suas gravações, compras sem DRM ou músicas livres de direitos). ⚠️ E lembre: não hospede músicas comerciais em repositório público — isso é distribuição não autorizada.

---

## ✨ Tudo que o app faz

Player completo (play/pause, pular, seek, volume), aleatório, repetir tudo/uma, playlists próprias (criar, adicionar, remover, excluir), Músicas Curtidas persistentes, busca ao vivo, gêneros, fila com "tocar em seguida", importação com leitura de tags ID3, biblioteca no repositório, controles na tela de bloqueio (Media Session), atalhos de teclado (Espaço, ←/→, Shift+←/→), layout desktop e mobile, funciona offline (interface + músicas importadas pelo Jeito 1).

## 📁 Estrutura

```
(raiz do repositório)
├── index.html      → interface
├── app.js          → lógica
├── manifest.json   → torna instalável
├── sw.js           → offline/cache
├── icons/          → ícones do app
└── musicas/        → seus MP3s + biblioteca.json
```

Divirta-se! 🎧
