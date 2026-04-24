# CryptoTrack

Aplicação SPA de acompanhamento de criptomoedas desenvolvida para a disciplina **ES47B-ES71 — Programação Web Fullstack** (Prof. Willian Massami Watanabe).

## Tecnologias

| Categoria | Escolha |
|---|---|
| Framework | React 18 + Vite |
| Estilização | CSS Modules + Material UI (MUI) |
| Formulários | React Hook Form |
| Validação | Yup |
| Hook avançado | `useReducer` |
| Comunicação | Context API (`FavoritesContext`) |
| API | CoinGecko API (pública, sem autenticação) |

## Estrutura

```
src/
├── components/
│   ├── SearchForm.jsx       # Formulário com RHF + Yup
│   ├── CoinCard.jsx         # Card de exibição de cada moeda
│   ├── CoinList.jsx         # Lista de resultados da busca
│   ├── TopRanking.jsx       # Top 10 por market cap (auto-carregado)
│   ├── FavoritesList.jsx    # Lista de favoritos
│   ├── ErrorMessage.jsx     # Mensagens de erro/validação
│   └── LoadingSpinner.jsx   # Feedback de carregamento
└── contexts/
    └── FavoritesContext.jsx # Context API — estado global de favoritos
```

## Instalação e execução

```bash
npm install
npm run dev
```

## Build para deployment

```bash
npm run build
# Arquivos prontos em /dist
```

## Sequência de commits sugerida

```bash
git init
git add .gitignore package.json vite.config.js index.html
git commit -m "feat: initial project setup with Vite and dependencies"

git add src/index.css src/main.jsx
git commit -m "feat: global styles and entry point"

git add src/contexts/FavoritesContext.jsx
git commit -m "feat: FavoritesContext with useReducer for global state"

git add src/components/ErrorMessage.*
git commit -m "feat: ErrorMessage component"

git add src/components/LoadingSpinner.*
git commit -m "feat: LoadingSpinner component"

git add src/components/CoinCard.*
git commit -m "feat: CoinCard component with useMemo and favorites toggle"

git add src/components/CoinList.*
git commit -m "feat: CoinList component with status-based rendering"

git add src/components/TopRanking.*
git commit -m "feat: TopRanking component with useReducer and auto-fetch"

git add src/components/FavoritesList.*
git commit -m "feat: FavoritesList component consuming FavoritesContext"

git add src/components/SearchForm.*
git commit -m "feat: SearchForm with React Hook Form, Yup validation and useReducer"

git add src/App.jsx src/App.module.css
git commit -m "feat: App layout with sidebar tabs and currency switcher"
```
