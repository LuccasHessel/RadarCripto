# Radar Cripto

O **Radar Cripto** é uma **SPA (Single Page Application)** moderna desenvolvida em React para o monitoramento de criptomoedas. A aplicação consome dados em tempo real da API CoinGecko, oferecendo uma interface fluida e dinâmica sem recarregamentos de página.

Este projeto demonstra competências de front-end como consumo de APIs REST, gerenciamento de estado global e design responsivo.

## Funcionalidades (Client-Side)

* **Renderização Dinâmica:** Listagem de moedas atualizada sem refresh.
* **Gestão de Favoritos:** Persistência de dados local para salvar moedas de interesse.
* **Filtro em Tempo Real:** Sistema de busca que filtra os dados recebidos da API.
* **Suporte a BRL (R$):** Tratamento de dados para exibição monetária brasileira.
* **Design Dark Mode:** Interface inspirada em estéticas retro-futuristas e streetwear.

## Arquitetura de Dados (Front-end Only)

A aplicação opera inteiramente no lado do cliente (Client-Side). Os dados são buscados diretamente da API pública da CoinGecko. 

> **Aviso de CORS:** Em ambiente local, a SPA utiliza o proxy do Vite para redirecionar as requisições. Para o deploy final em ambientes estáticos como GitHub Pages, a integração é feita diretamente com o endpoint público da API.

## Como Executar

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/LuccasHessel/RadarCripto.git](https://github.com/LuccasHessel/RadarCripto.git)
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Rode localmente:**
    ```bash
    npm run dev
    ```

## 👨‍💻 Autor

**Luccas Hessel** - Estudante de Engenharia de Software - UTFPR

---
© 2026 - Radar Cripto
