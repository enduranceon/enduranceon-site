# Troca do site: site novo no www

Rascunho preparado em 29/10/2026. Nada disto vale até a solicitação ser liberada pelo Guto.

## O que a troca faz

- A **home** passa a ser a do site novo. A home atual fica guardada em `/home-antiga.html` (sem indexação, sem link), para comparar e para voltar atrás.
- Entram páginas novas na raiz: `/calendario`, `/treinos-coletivos`, `/parceiros`, `/contato`, `/treinador-<nome>` (5), `/cadastro` e `/cadastro-recebido`.
- As páginas antigas equivalentes passam a redirecionar (301) para as novas (`netlify.toml`, 18 regras, cada uma com e sem `.html`). O redirecionamento antigo `guto-fernandes-bio` agora aponta direto para a página nova.
- Google Analytics 4 (`G-PQX6YBZD9P`) em todas as páginas novas, só nos endereços oficiais.
- Páginas públicas liberadas para o Google (`index,follow`) com título, descrição, `canonical` e Open Graph. `/cadastro` e `/cadastro-recebido` continuam `noindex`.
- `robots.txt` e `sitemap.xml` novos (o www não tinha nenhum dos dois).
- Fotos pesadas reduzidas (no máximo 2400 px; capa 2560 px). Os originais do projeto não foram alterados.
- O formulário de **contato** e o envio de interesse do **calendário** ficam em modo de verdade.
- O cadastro novo pede data de nascimento (obrigatória) e gênero (opcional).

## O que não muda

Tudo que o site novo não substitui continua como está: `/pages/cadastro-unificado` (plano B), `/pages/cadastro-recebido`, `/pages/obrigado`, calculadoras (incluindo `/pages/calculadora-match`), `/pages/termos`, `/link-bio`, `/dataseon`, `/datasironman`, `/regata-aero-race`, relatórios, testes, `/manutencao`, e os scripts e estilos antigos.

O botão "Encontrar meu coach" da home leva à calculadora de match que já está no ar (`/pages/calculadora-match`), porque o simulador novo ainda está em teste e não entra na troca.

## Como ver antes de liberar

Cada solicitação do GitHub gera uma prévia no Netlify. Nela dá para navegar por tudo, testar os redirecionamentos e ver os arquivos. Limites da prévia:

- A consulta de planos, o cadastro e o contato só funcionam no endereço oficial (o catálogo, a Cloudflare e a loja só aceitam o www). Na prévia a seção de planos mostra "Catálogo indisponível". Para ver o visual com os planos, use o link de teste do site novo (https://eon-novo.netlify.app), que tem o mesmo conteúdo.
- O Analytics não conta nada fora do www.

## Antes de liberar

1. Teste real do cadastro com nascimento e gênero no www (página escondida de teste) e saída das duas páginas de teste (`teste-cadastro-novo` e `teste-contato-novo`). Feito em 29/10: as duas pastas foram removidas depois da troca.
2. Texto de consentimento do formulário de contato aprovado.
3. Decisão sobre o Vinicius Koerich (a home mostra retrato provisório e aviso) e a Elinai (sem planos no ar; o botão dela leva ao WhatsApp).
4. Decisão sobre menores de 18 anos (hoje não há bloqueio nem aviso).
5. Conferir na prévia: páginas, imagens, redirecionamentos e celular.

## Depois de liberar (primeira hora)

- Abrir a home, o calendário e um treinador no www e no celular.
- Fazer um cadastro de teste e uma mensagem de contato de teste (e remover os registros de teste na EON Store: "Descartar venda" e "Remover").
- Conferir no Google Analytics (tempo real) que as visitas aparecem.
- Enviar `sitemap.xml` no Google Search Console.

## Como voltar atrás

Reverter a solicitação no GitHub (botão "Revert"). A home antiga volta, as páginas novas saem e os redirecionamentos somem. Enquanto a troca não for revertida, `/home-antiga.html` mostra a home de antes.

## Fora desta troca

Simulador de match novo, calculadoras no visual novo, link do plano e Termos no visual novo, correção do link `/eonstore` do `link-bio` (o endereço certo da loja é `https://eon-store.netlify.app/loja`), limpeza de páginas de backup e o evento de Analytics `filtro_treinos_coletivos` (disparado pelo `js/script.js` antigo, usado pela home antiga e pela página antiga de treinos coletivos; as páginas novas não o disparam, só o `submit_lead_form` do cadastro).
