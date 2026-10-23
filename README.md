# music.pivi.dev

Vetrina statica delle playlist Spotify della serie **Pivəəkly**: tutti i numeri con copertine e
player, statistiche, timeline delle uscite, artisti ricorrenti. Il sito non chiama mai l'API
Spotify e non contiene credenziali: i dati vengono scaricati in locale da `pnpm sync`, ripuliti
e committati come JSON, poi GitHub Actions compila e pubblica il sito su GitHub Pages.

- **Sito:** <https://music.pivi.dev>
- **Stack:** pnpm workspace, Vue 3 (`<script setup>`) con TypeScript strict, Vite, Tailwind CSS
  v4 e CSS nativo, Pinia, Vue Router, Vitest, zod, remeda.

## Indice

- [Requisiti](#requisiti)
- [Setup dell'app Spotify](#setup-dellapp-spotify)
- [Primo avvio](#primo-avvio)
- [Comandi](#comandi)
- [Come vengono scelte le Pivəəkly](#come-vengono-scelte-le-pivəəkly)
- [Quando il token scade](#quando-il-token-scade)
- [Architettura](#architettura)
- [Sicurezza](#sicurezza)
- [Deploy](#deploy)

## Requisiti

- Node.js ≥ 22.22 e pnpm ≥ 10.28 (`corepack enable` usa la versione fissata in `package.json`).
- Un account **Spotify Premium**: dal 2026 le app in _Development Mode_ funzionano solo se
  l'owner dell'app ha Premium.

## Setup dell'app Spotify

L'app esiste già. Se un giorno serve ricrearla:

1. Vai su <https://developer.spotify.com/dashboard> e crea un'app ("Web API").
2. In **Redirect URIs** aggiungi un indirizzo di loopback, per esempio
   `http://127.0.0.1:8888/callback`. Spotify non accetta più `localhost`: usa `127.0.0.1`.
3. L'app resta in **Development Mode**: l'owner deve avere Premium e i contenuti delle playlist
   sono leggibili solo per le playlist di cui sei owner o collaboratore.
4. Copia **Client ID** e **Client secret** dalle impostazioni dell'app.

Vincoli dell'API attuale di cui il codice tiene conto: gli endpoint delle playlist sono
`/playlists/{id}/items` (nel JSON `tracks` → `items`, `items[].track` → `items[].item`); non
esistono più audio-features, recommendations, related-artists, top-tracks degli artisti né gli
endpoint batch; `popularity`, `followers` e `label` non vengono usati.

## Primo avvio

```sh
pnpm install
cp .env.example .env    # poi compila SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
pnpm auth               # apre il flusso di autorizzazione e salva il refresh token in .env
pnpm sync               # scarica le playlist e scrive music/src/data/*.json
pnpm dev                # http://localhost:5173
```

Il valore di `SPOTIFY_REDIRECT_URI` deve coincidere **esattamente** con uno dei Redirect URI
registrati nell'app: `pnpm auth` ascolta proprio su quella porta e quel path.

Senza login puoi lavorare sul design con i dati inventati: `pnpm fixtures` rigenera
`music/src/data/` con numeri Pivəəkly finti. Quando i dati vengono dalle fixture il sito lo
dichiara con un avviso.

## Comandi

| Comando               | Cosa fa                                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm auth`           | Authorization Code flow con PKCE su un server locale; salva `SPOTIFY_REFRESH_TOKEN` in `.env`. Da lanciare la prima volta e quando il token scade.                                                               |
| `pnpm sync`           | Scarica playlist, brani, artisti e "in rotazione", li converte nel modello di dominio, estrae la palette delle copertine, sanitizza e scrive `music/src/data/*.json`. `pnpm sync -- --no-cache` ignora la cache. |
| `pnpm release`        | Da `main`: `sync`, poi typecheck, lint, format, test, build e verifica di sicurezza; se tutto passa committa **solo** `music/src/data/` (`chore(data): sync AAAA-MM-GG`) e fa push. Il push avvia il deploy.     |
| `pnpm dev`            | Server di sviluppo della webapp.                                                                                                                                                                                 |
| `pnpm build`          | Build di produzione in `music/dist` (con `404.html` per il routing su GitHub Pages).                                                                                                                             |
| `pnpm check`          | typecheck + lint + format:check + test.                                                                                                                                                                          |
| `pnpm test`           | Test unitari Vitest di tutti i pacchetti.                                                                                                                                                                        |
| `pnpm security:scan`  | Cerca token, secret, id utente e chiavi vietate in `music/src/data` e `music/dist`.                                                                                                                              |
| `pnpm security:audit` | `pnpm audit` delle dipendenze.                                                                                                                                                                                   |
| `pnpm fixtures`       | Scrive i dati di esempio inventati.                                                                                                                                                                              |

Il nome `deploy` non viene usato perché è un comando interno di pnpm.

## Come vengono scelte le Pivəəkly

Le regole stanno in [`sync/playlists.config.ts`](sync/playlists.config.ts):

- si parte da `GET /me/playlists`;
- si considerano **solo le playlist di cui sei owner**;
- il nome deve iniziare con il prefisso `prefix` (default `"Pivəəkly"`, con due **ə**, U+0259).
  Il confronto avviene su stringhe normalizzate NFC e senza distinzione tra maiuscole e
  minuscole, quindi vanno bene anche `PIVƏƏKLY` e i nomi digitati con la ə scomposta;
- `exclude`: id da non pubblicare mai, qualunque sia il nome;
- `include`: id da pubblicare anche se il nome non corrisponde (sempre solo se sei owner);
- `tags`: mood opzionali per id, usati dai filtri del sito.

Il numero viene estratto dal nome (`Pivəəkly 12`, `Pivəəkly #12`, `Pivəəkly Nº 12`…). Una
playlist senza numero viene pubblicata in fondo, come "Fuori serie".

Ogni `sync` stampa un riepilogo con:

- le playlist incluse e il motivo;
- le playlist escluse e il motivo: esclusa in config, non sei owner, oppure nome che somiglia
  alla serie ma non corrisponde (spesso una "e" al posto della "ə");
- i numeri mancanti nella sequenza, quelli duplicati e le playlist senza numero;
- gli id in `include`/`exclude` che non corrispondono a nessuna tua playlist.

Nessuna playlist fuori da queste regole finisce nei JSON pubblicati.

La data di "uscita" di un numero è il primo `added_at` dei suoi brani: Spotify non espone la data
di pubblicazione di una playlist, e il sito lo dichiara accanto alle date.

## Quando il token scade

Il refresh token Spotify scade **6 mesi dopo l'autorizzazione** (o se revochi l'accesso
all'app). In quel caso `pnpm sync` si ferma con:

> Il refresh token Spotify non è più valido […]. Rilancia `pnpm auth` e poi `pnpm sync`.

Basta rilanciare `pnpm auth`. Se Spotify ruota il refresh token durante un sync, il nuovo valore
viene salvato in `.env` in automatico.

## Architettura

```
music/    webapp Vue: legge solo i JSON statici, non conosce l'API Spotify
sync/     script Node che scarica, adatta e sanitizza i dati
shared/   modello di dominio, schemi zod, regole della serie e di sicurezza, fixture
scripts/  release e verifica di sicurezza
```

Design pattern:

- **Adapter** (`sync/src/adapter.ts`): converte i DTO Spotify (validati con zod in
  `sync/src/spotify/schemas.ts`) nel modello di `shared/src/domain.ts`. Tutta la conoscenza
  dell'API vive in `sync/`.
- **Client Spotify** (`sync/src/spotify/client.ts`):
  - richieste in coda con intervallo minimo;
  - retry con backoff esponenziale su 429 (rispettando `Retry-After`), su 5xx ed errori di rete;
  - refresh del token su 401;
  - cache su disco in `.sync-cache/`: i brani sono indicizzati per `snapshot_id`, quindi si
    riscaricano solo le playlist cambiate; artisti e palette hanno una scadenza.
- **Repository** (`music/src/repositories/PlaylistRepository.ts`): l'unico modulo che importa i
  JSON; una regola ESLint lo impone.
- **Service layer puro** (`music/src/services/stats/`): riepiloghi, classifiche, heatmap,
  distribuzione per anno/decennio, similarità di Jaccard, timeline e intervalli, artisti
  ricorrenti, indice di scoperta, brani ripetuti. Sono funzioni pure, testate con Vitest.
- **Strategy** (`music/src/strategies/`): ogni ordinamento o filtro è una strategia; si
  compongono con `sortWith`/`filterWith` e `chainSorts`/`withDirection`.
- **Pinia** per lo stato UI (tema, ordinamento e filtri della vetrina); **composables** per la
  logica riusabile (`useCatalog`, `useAccent`); componenti per feature (`playlists/`, `stats/`,
  `series/`, `player/`) più quelli di base in `ui/`.

Design "Aurora": pannelli di vetro su sfumature colorate. Le sfumature prendono i colori dalla
palette della copertina in vista, estratta durante il sync con `sharp`. Il sito ha tema chiaro e
scuro (automatico, o scelto con il pulsante nell'header). Gli accenti vengono corretti in modo da
avere sempre un contrasto WCAG AA. Il sito è navigabile da tastiera e rispetta
`prefers-reduced-motion`. Il logo è la "p" vinile (`music/src/components/ui/BrandMark.vue`,
`music/public/brand/`).

Per l'ascolto il sito usa l'embed ufficiale di Spotify (nessun login richiesto). Attribuzione:
logo Spotify e link "Ascolta su Spotify" accanto ai contenuti, più una nota nel footer.

### Qualità

- ESLint flat config con regole Vue e TypeScript, più le regole di documentazione di
  [TravelMap](https://github.com/thisispivi/TravelMap): JSDoc sulle dichiarazioni e commenti
  come blocchi su riga propria.
- Prettier.
- Husky + lint-staged al pre-commit e commitlint (Conventional Commits) al commit-msg.

## Sicurezza

Il repository è pubblico, quindi:

- Client ID, client secret e refresh token stanno **solo** in `.env`, che è gitignored (c'è
  `.env.example` senza valori). Non servono secret su GitHub.
- Il bundle non contiene token e non chiama l'API Spotify.
- La sanitizzazione è obbligatoria (`sync/src/sanitize.ts`):
  - i dati passano dagli schemi zod del dominio, che scartano ogni chiave non dichiarata
    (`added_by`, owner, id dei collaboratori…);
  - un secondo controllo rifiuta le chiavi vietate;
  - id e nome dell'account e gli id dei collaboratori vengono rimossi da nomi e descrizioni
    delle playlist.
- `pnpm security:scan` (in `release` e in CI) fallisce se in `music/src/data/` o `music/dist/`
  trova stringhe simili a token Spotify, header Bearer, id/secret esadecimali, URI o link di
  utenti, chiavi vietate o i valori reali del tuo `.env`.
- `pnpm audit` gira in CI. `pnpm-workspace.yaml` rifiuta i pacchetti pubblicati da meno di una
  settimana.

## Deploy

`.github/workflows/deploy.yml` parte a ogni push su `main` e da `workflow_dispatch`:

1. install, `pnpm audit`, typecheck, lint, format, test, build, security scan;
2. `actions/upload-pages-artifact` e `actions/deploy-pages`.

Non esiste un branch `gh-pages`: GitHub Pages è configurato su "GitHub Actions". Il dominio
custom è in `music/public/CNAME` (`music.pivi.dev`), quindi Vite usa `base: "/"`. Sulle pull
request il workflow esegue solo la verifica.
