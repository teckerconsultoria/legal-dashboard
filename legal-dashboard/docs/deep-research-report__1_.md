# Diagnóstico de saúde e qualidade de dados processuais por OAB com a API do Escavador

## Resumo executivo

A API do Escavador permite construir um “painel de saúde” (data health) da base de processos vinculados a um registro de OAB, combinando: (a) **listagem do universo de processos** do advogado por OAB, (b) **consulta estruturada** da “capa” e metadados do processo por numeração CNJ, (c) **extração completa de movimentações** (andamentos e publicações) e (d) **mecanismos de atualização/monitoramento** para medir atualidade, taxas de erro e latência operacional. citeturn5view1turn8view2turn10view0turn25view3turn14view6

Na prática, o diagnóstico de saúde/qualidade por OAB pode ser estruturado em três camadas:

1) **Cobertura** (o que existe): validar a contagem e a distribuição do portfólio do advogado por tribunais, anos e status (predito) usando `GET /api/v2/advogado/resumo` e `GET /api/v2/advogado/processos`. citeturn4view1turn5view1turn4view0  
2) **Qualidade estrutural** (o quão “bom” está): medir completude/consistência dos campos (CNJ, datas, fontes, envolvidos, assuntos, status, etc.) com as estruturas padrão de resposta (Processo, ProcessoFonte, Envolvido, Movimentação). citeturn16view1turn16view4turn14view1turn14view3turn37view3  
3) **Atualidade e confiabilidade operacional** (o quão “saudável” está no tempo): calcular “staleness” via `data_ultima_verificacao`, acompanhar sucesso/erro/NAO_ENCONTRADO em atualizações assíncronas e usar callbacks/monitoramentos para comparar o que muda e quando muda. citeturn16view1turn25view3turn21view0turn14view6  

Como contexto de escala (útil para calibrar expectativas de variabilidade e heterogeneidade), o site da API do Escavador divulga números agregados como “+450 milhões” de processos na base, “+1,7 milhões” atualizados diariamente e “+14 milhões” de movimentações capturadas mensalmente. citeturn30view3

## Fontes e documentação consultadas

**Sub-URLs do ecossistema Escavador consultados (lista explícita)**  
(Observação: as URLs abaixo estão em bloco de código para manter fidelidade literal.)

```text
https://www.escavador.com/
https://www.escavador.com/api                         (falha ao carregar)
https://www.escavador.com/api/documentacao             (404)
https://www.escavador.com/api/v1/processos             (404)
https://www.escavador.com/api/v1/movimentacoes         (404)

https://api.escavador.com/
https://api.escavador.com/v2/docs/
https://api.escavador.com/v1/docs

https://suporte-api.escavador.com/hc/pt-br/articles/13916942181915-O-Algoritmo-de-Match-na-API-do-Escavador
https://suporte-api.escavador.com/hc/pt-br/articles/29095036394651-Como-identificar-se-um-processo-est%C3%A1-ativo-ou-inativo-na-API-do-Escavador
https://suporte-api.escavador.com/hc/pt-br/articles/27682373298331-Como-funciona-a-cobran%C3%A7a-do-processo-na-v2
https://suporte-api.escavador.com/hc/pt-br/articles/37240565233051-Como-atualizar-um-processo-pela-API-v2
https://suporte-api.escavador.com/hc/pt-br/articles/20302078660379-Relat%C3%B3rio-de-consumo-API
https://suporte-api.escavador.com/hc/pt-br/articles/16486878217883-Novas-rotas-de-busca-na-API-v2
https://suporte-api.escavador.com/hc/pt-br/articles/30114576118555-Acessando-os-Autos-de-Processos-via-API-v2-com-Certificado-Digital

https://github.com/Escavador/escavador-python
```  
citeturn30view4turn38view0turn38view1turn38view2turn38view3turn30view3turn2view0turn11view0turn18view0turn19view0turn19view1turn21view0turn22view0turn23view0turn20view0turn32view0

**Outras fontes oficiais em português consultadas (para validação e compliance)**

- A entity["organization","Conselho Nacional de Justiça","judiciary council, Brazil"] define a estrutura da numeração única CNJ (`NNNNNNN-DD.AAAA.J.TR.OOOO`) e explicita que o dígito verificador (DD) usa o algoritmo “Módulo 97 Base 10” conforme “ISO 7064:2003”. citeturn30view1turn17view1  
- O texto da LGPD (Lei nº 13.709/2018), em versão publicada no portal da entity["organization","Câmara dos Deputados","lower house, Brazil"], define conceitos básicos (dado pessoal, tratamento, anonimização etc.) e o objetivo de proteger liberdade/privacidade. citeturn31view1  
- Uma página informativa do portal gov.br lista princípios aplicáveis às atividades de tratamento, incluindo “qualidade dos dados”, “necessidade”, “segurança” e “transparência”, úteis para orientar governança do pipeline analítico. citeturn31view2  

## Endpoints recomendados e estratégia de coleta por OAB

### Visão geral da estratégia

**Fluxo recomendado (priorizando API v2):**
1) Identificar o “universo” do advogado: `GET /api/v2/advogado/resumo` → valida nome, tipo de OAB e quantidade de processos. citeturn4view1  
2) Extrair a lista paginada de processos: `GET /api/v2/advogado/processos` (com filtros e paginação via `links.next`). citeturn5view1turn4view0  
3) Para amostras (ou para o universo todo, se viável):  
   - `GET /api/v2/processos/numero_cnj/{numero}` para capa/metadados completos (inclui fontes, envolvidos por fonte, capa por fonte, audiências etc.). citeturn8view2turn8view1turn16view4  
   - `GET /api/v2/processos/numero_cnj/{numero}/movimentacoes` para timeline de movimentações (andamentos/publicações), com paginação por cursor. citeturn10view0turn9view0turn10view0  
4) Medir atualidade e confiabilidade:  
   - `GET /api/v2/processos/numero_cnj/{numero}/status-atualizacao` (mede staleness e status de atualização). citeturn25view2turn25view3  
   - `POST /api/v2/processos/numero_cnj/{numero}/solicitar-atualizacao` (assíncrono; depois consultar status ou esperar callback). citeturn25view3turn21view0  
5) Para documentos:  
   - Públicos: `GET /api/v2/processos/numero_cnj/{numero}/documentos-publicos` e `GET /api/v2/processos/numero_cnj/{numero}/documentos/{key}`. citeturn35view0turn37view0  
   - Autos (públicos+restritos): `GET /api/v2/processos/numero_cnj/{numero}/autos` (requer atualização prévia com `autos=1` e status `SUCESSO`). citeturn35view6turn36view0  
6) Operacionalização contínua: usar callbacks e monitoramentos para reduzir polling e medir “tempo de ingestão” operacional (quando o evento chega). citeturn14view6turn33view0  

### Tabela comparativa de endpoints essenciais

| Objetivo | Endpoint (URL) | Parâmetros principais | Resposta chave para diagnóstico | Observações |
|---|---|---|---|---|
| Resumo do advogado por OAB | `https://api.escavador.com/api/v2/advogado/resumo` | `oab_estado` (obrig.), `oab_numero` (obrig.), `oab_tipo` (opc.) | `nome`, `tipo`, `quantidade_processos` | Útil para “sanity check” de cobertura. citeturn4view1turn35view0 |
| Listar processos do advogado por OAB | `https://api.escavador.com/api/v2/advogado/processos` | `oab_estado`, `oab_numero`, `oab_tipo` (opc.), `limit` (50/100), `tribunais[]`, `status` (ATIVO/INATIVO), `data_minima`, `data_maxima` | `items[]` com metadados de processo + `links.next` | `links.next` inclui cursor; semântica de `cursor`/`li`: **não especificado**. citeturn4view0turn5view1 |
| Capa/metadados completos por CNJ | `https://api.escavador.com/api/v2/processos/numero_cnj/{numero}` | `numero` (CNJ; aceita 20 dígitos sem formatação) | `fontes[]` (com `capa`, `envolvidos`, flags) + campos raiz (`data_ultima_verificacao`, `quantidade_movimentacoes`) | Base para completude/consistência de campos. citeturn8view2turn16view1turn16view4 |
| Movimentações por CNJ | `https://api.escavador.com/api/v2/processos/numero_cnj/{numero}/movimentacoes` | `limit` (50/100/500) | `items[]` (movimentações) + paginação (`links.next`) | Indicador de granularidade e ritmo processual. citeturn10view0turn9view0 |
| Status de atualização | `https://api.escavador.com/api/v2/processos/numero_cnj/{numero}/status-atualizacao` | `numero` (CNJ) | `data_ultima_verificacao`, `ultima_verificacao.status` | Status possíveis: `PENDENTE`, `SUCESSO`, `NAO_ENCONTRADO`, `ERRO`. citeturn25view3turn25view2 |
| Solicitar atualização (assíncrono) | `https://api.escavador.com/api/v2/processos/numero_cnj/{numero}/solicitar-atualizacao` | Parâmetros de atualização (ex.: `autos=1`, `documentos_publicos=1`, callback) | Retorno da solicitação; depois consultar status | Detalhes completos do payload/params: parcialmente descritos; alguns aspectos aparecem na Central de Ajuda. Campos exatos: **parcialmente especificado**. citeturn25view3turn35view0turn35view6turn21view0turn20view2 |
| Envolvidos por CNJ | `https://api.escavador.com/api/v2/processos/numero_cnj/{numero}/envolvidos` | `numero` (CNJ) | `items[].participacoes_processo[]` | Permite checar completude de partes e advogados. citeturn37view0turn37view3 |
| Documentos públicos | `https://api.escavador.com/api/v2/processos/numero_cnj/{numero}/documentos-publicos` | `limit` (50/100) | `items[]` com `{id,titulo,tipo,key,links.api}` | Retorna 422 para CNJ inválido; útil para testes de validação. citeturn35view4turn35view5 |
| Download via key | `https://api.escavador.com/api/v2/processos/numero_cnj/{numero}/documentos/{key}` | path params `numero`, `key` | conteúdo/metadata | Referenciado pela lista de documentos/autos. citeturn37view0 |

### Endpoints complementares (API v1) para “auditoria cruzada” e cobertura

Embora a v2 seja a mais rica em estrutura, a v1 pode ajudar em dois cenários:  
(1) **auditar cobertura via diários oficiais** e (2) usar **buscas assíncronas diretas em tribunais** (quando aplicável) para comparar “o que o tribunal retorna” vs “o que está consolidado na base”. citeturn33view3turn27view4turn28view0

| Objetivo | Endpoint (URL) | Pontos de atenção para diagnóstico |
|---|---|---|
| Buscar processos em diários por OAB | `https://api.escavador.com/api/v1/oab/{estado}/{numero}/processos?page=1` | A própria doc alerta que **não é garantido** retornar todos os processos da OAB, pois depende do que foi extraído dos diários. citeturn28view0turn27view1 |
| Movimentações (diários) por processoId | `https://api.escavador.com/api/v1/processos/{processoId}/movimentacoes?limit=20&page=1` | Movimentação aqui é “o que saiu em diários”; pode servir como “sinal externo” de eventos. citeturn27view1turn28view5 |
| Envolvidos (diários) por processoId | `https://api.escavador.com/api/v1/processos/{processoId}/envolvidos?limit=20&page=1` | Útil para comparar nomes/OAB capturados em diários vs estrutura consolidada na v2. citeturn27view3turn26view4 |
| Busca assíncrona por OAB no tribunal | `https://api.escavador.com/api/v1/tribunal/{origem}/busca-por-oab/async` | Depende de tempo de resposta, captcha etc.; há opção `permitir_parcial`; resultado vem por callback ou consulta de `link_api`. citeturn29view0turn27view4 |
| Consultar resultados assíncronos | `https://api.escavador.com/api/v1/async/resultados` e `.../{id}` | Permite medir taxa de sucesso/pendência/erro do “robô do tribunal” como métrica operacional. citeturn34view0turn34view1 |

## Mapa de campos e significado

A v2 documenta estruturas reutilizadas: `Processo`, `ProcessoFonte`, `ProcessoFonteCapa`, `Envolvido`, `Movimentação` e `MovimentacaoFonte`. Isso é a base para construir **regras de qualidade** (tipos, presença, consistência entre campos) e **métricas agregadas**. citeturn16view0turn16view4turn14view1turn14view2

### Tabela de campos críticos por domínio

**Processo (raiz) — campos para saúde global e atualidade**

| Campo | Significado | Usos diretos no diagnóstico |
|---|---|---|
| `numero_cnj` | Identificador CNJ do processo | Chave primária; validar formato e DV; deduplicação e integridade referencial. citeturn16view0turn30view1turn17view1 |
| `data_inicio` | Data de início (`YYYY-MM-DD`) | Coerência temporal (ex.: não pode ser após `data_ultima_movimentacao`). citeturn16view0turn8view1 |
| `data_ultima_movimentacao` | Data da última movimentação conhecida | Comparar com max(data) nas movimentações coletadas; medir dinamismo. citeturn16view0turn9view0 |
| `quantidade_movimentacoes` | Total de movimentações registradas | Checar consistência vs contagem real extraída (após paginação completa). citeturn16view0turn9view0 |
| `data_ultima_verificacao` | Timestamp ISO 8601 da última verificação em fontes oficiais | Métrica central de “atualidade” (staleness). citeturn16view1turn21view0 |
| `tempo_desde_ultima_verificacao` | Texto humano (“há 1 mês”) | Útil para UX; para métricas, compute em dias a partir de `data_ultima_verificacao`. citeturn16view1turn8view1 |
| `fontes_tribunais_estao_arquivadas` | Indica se todas fontes TRIBUNAL estão “inativas” | Validar consistência com `status_predito` por fonte. citeturn16view1turn19view0 |
| `fontes[]` | Lista de fontes (tribunais/diários) do processo | Base para cobertura por tribunal, grau, sistema, segredo de justiça, físico/digital. citeturn16view1turn16view4 |

**ProcessoFonte — cobertura por tribunal e consistência interfontes**

| Campo | Significado | Usos de qualidade |
|---|---|---|
| `sigla`, `nome`, `tipo` | Identidade da fonte (TRIBUNAL/DIARIO_OFICIAL) | Cobertura por tribunal; comparar padrões de campos entre fontes. citeturn16view2turn14view2 |
| `segredo_justica`, `fisico` | Flags do processo na fonte | Explicam lacunas (ex.: `NAO_ENCONTRADO` em atualizações pode ocorrer por segredo/arquivo/físico). citeturn16view2turn25view3 |
| `status_predito` | `ATIVO`/`INATIVO` por IA | Controlar risco de erro de classificação; comparar com sinais de movimentações recentes. citeturn16view3turn19view0 |
| `capa` (quando tribunal) | Objeto com classe/assuntos/órgão julgador/valor | Validação de completude do “núcleo semântico” do processo. citeturn16view4turn15view3 |
| `envolvidos[]` (por fonte) | Pessoas/instituições e papéis | Checar consistência “título do polo” vs envolvidos; detectar nomes truncados/normalização. citeturn16view4turn14view3 |

**Movimentação — granularidade temporal e duplicidade**

| Campo | Significado | Usos |
|---|---|---|
| `id` | ID único da movimentação no Escavador | Deduplicação; integridade (ID não pode repetir dentro do mesmo processo). citeturn14view1turn9view0 |
| `data` | Data do evento (`YYYY-MM-DD`) | Base para latência entre eventos, sazonalidade e ritmo por tribunal/assunto. citeturn14view1turn9view0 |
| `tipo` | Distingue andamento/publicação | Métrica de composição (ANDAMENTO vs PUBLICACAO) e cobertura (se só um tipo aparece). citeturn14view1turn14view6 |
| `conteudo` | Texto do evento | Mineração de tópicos; checar strings vazias; padronização/normalização. citeturn14view1turn9view0 |
| `fonte.*` | Fonte + grau + caderno (quando diário) | Explicar diferenças e duplicidades entre diários e tribunais; segmentar métricas por origem. citeturn14view2turn9view0 |

**Envolvidos e participações — completude de partes e vínculo com OAB**

O endpoint de envolvidos por CNJ retorna `items[]` e, para cada item, uma lista `participacoes_processo[]` com tipo/polo/advogados e a fonte associada. citeturn37view3  
Além disso, a estrutura geral `Envolvido` documenta campos como `tipo_pessoa`, `cpf/cnpj` (quando disponível) e `oabs[]` quando o envolvido é advogado. citeturn14view3turn14view4

## Métricas e regras para diagnosticar saúde e qualidade

Abaixo está um conjunto de métricas focadas em **saúde operacional** (atualidade/erros) e **qualidade de dados** (completude/consistência/duplicidade), desenhadas para o recorte “processos vinculados a uma OAB”.

### Métricas de cobertura e universo por OAB

**Cobertura do universo (consistência entre endpoints):**
- `coverage_count_gap = | qtd_resumo - qtd_unicos_advogado_processos | / qtd_resumo`  
  - `qtd_resumo`: `quantidade_processos` do `/advogado/resumo`. citeturn4view1  
  - `qtd_unicos_advogado_processos`: contagem de `numero_cnj` únicos extraídos de todas as páginas do `/advogado/processos`. citeturn5view1turn4view0  
  Interpretação: gap alto sugere falha de paginação, duplicidade por cursor, ou inconsistência de dedup.

**Cobertura por tribunal e “pontos cegos”:**
- `%processos_por_sigla = count(processos com fontes[].sigla==X) / total_processos`  
  Ajuda a identificar tribunais onde a carteira do advogado se concentra e onde vale priorizar testes ou atualização. A estrutura de `fontes[]` e `sigla` é documentada. citeturn16view2turn16view4  

**Cobertura “externa” (auditoria) via v1 — opcional:**
- `diarios_hit_rate`: proporção de processos encontrados em `GET /api/v1/oab/{UF}/{numero}/processos` vs v2.  
  Interpretação: não é para “cobrar completude” (a própria doc afirma que não é garantido retornar todos), mas para ter um sinal adicional de “onde há publicação recorrente em diários”. citeturn28view0turn28view2  

### Métricas de completude (campos obrigatórios vs nulos)

Defina uma “matriz de completude” para cada processo com campos que, na prática, impactam decisões e análises:

- Processo: `data_inicio`, `estado_origem`, `unidade_origem`, `data_ultima_movimentacao`, `data_ultima_verificacao`. citeturn16view0turn8view1  
- ProcessoFonte: `tipo`, `sigla`, `grau`, `sistema`, `fisico`, `segredo_justica`, `quantidade_movimentacoes`, `data_ultima_verificacao`. citeturn16view3turn14view0  
- ProcessoFonteCapa (quando tribunal): `classe`, `assuntos_normalizados`, `orgao_julgador`, `data_distribuicao`, `valor_causa`. citeturn16view4turn15view3  
- Movimentação: `data`, `conteudo`, `tipo`, `fonte.sigla`. citeturn14view1turn14view2  

**Score de completude sugerido (exemplo):**  
- `completude_processo = (#campos_preenchidos / #campos_avaliados)`  
- `completude_capa = (#campos_capa_preenchidos / #campos_capa_avaliados)` apenas para fontes TRIBUNAL com `capa` presente.

### Métricas de consistência e integridade referencial

**Validade do CNJ (estrutura + dígito verificador):**
- Regras:  
  - Estrutura `NNNNNNN-DD.AAAA.J.TR.OOOO` (CNJ). citeturn30view1turn17view1  
  - DV calculado por “Módulo 97 Base 10” (ISO 7064:2003). citeturn30view1turn17view1  
- Métrica: `%cnj_validos = count(cnj_validos)/total`.

**Consistência `quantidade_movimentacoes`:**
- `delta_qtd_mov = |quantidade_movimentacoes - count(movimentacoes_coletadas)|`  
  Requer paginação completa de `/movimentacoes`. citeturn16view0turn10view0

**Consistência `data_ultima_movimentacao`:**
- `delta_data = data_ultima_movimentacao - max(movimentacoes.data)`  
  Esperado: `delta_data == 0` quando todas as movimentações foram coletadas e a base está coerente.

**Consistência “ativo/inativo”:**
- A Central de Ajuda indica que `status_predito` por fonte (TRIBUNAL) é classificado por IA e que `fontes_tribunais_estao_arquivadas` na raiz indica se todas as fontes TRIBUNAL estão “INATIVO”. citeturn19view0turn16view1  
- Regra de validação:  
  - `fontes_tribunais_estao_arquivadas == true` ⇒ para toda fonte `tipo==TRIBUNAL`, `status_predito == INATIVO`.  
  - Divergências devem ser registradas como “inconsistência lógica” (e também ponderadas pelo fato da classificação ser por IA, portanto sujeita a erro). citeturn19view0turn4view0

### Métricas de atualidade, latência e confiabilidade operacional

**Staleness (envelhecimento do dado):**
- `staleness_dias = hoje - data_ultima_verificacao` (por processo e por fonte).  
  A documentação e a Central de Ajuda tratam `data_ultima_verificacao` como indicador do último momento em que robôs consultaram os sistemas e atualizaram a base. citeturn16view1turn21view0  

**Taxa de atualização bem-sucedida (observabilidade do robô):**
- Ao solicitar atualização, o status pode ser `PENDENTE`, `SUCESSO`, `NAO_ENCONTRADO` ou `ERRO`. citeturn25view3turn21view0  
- Métricas recomendadas:  
  - `update_success_rate` = SUCESSO / total_solicitacoes  
  - `not_found_rate` = NAO_ENCONTRADO / total_solicitacoes  
  - `error_rate` = ERRO / total_solicitacoes  
  - `p95_duracao_atualizacao` = percentil 95 de (`concluido_em - criado_em`) usando o objeto retornado em `status-atualizacao`. citeturn25view2turn25view3  

**Ritmo processual por OAB (movimentações):**
- `mov_por_processo_30d`: contagem de movimentações nos últimos 30 dias por processo.  
- `pct_processos_ativos_em_mov`: % de processos com ao menos 1 movimentação nos últimos 30 dias (bom proxy de “carteira quente”).  
- `mix_tipo_mov`: % ANDAMENTO vs PUBLICACAO (se disponível). A distinção aparece no callback e no endpoint de movimentações. citeturn14view6turn9view0  

**Latência entre movimentações (não confundir com latência de captura):**
- `gap_dias = diff(data)` entre movimentações consecutivas no mesmo processo.  
  Interpretação: gap alto pode ser normal (fase inerte), mas também pode sinalizar subcobertura se inúmeros processos exibirem gaps anômalos em um mesmo tribunal/classe.

### Duplicidade e granularidade

**Duplicidade de movimentações:**
- Duplicidade por ID: `count(distinct id) < count(id)` dentro do mesmo processo. `id` é documentado como identificador único da movimentação no Escavador. citeturn14view1turn9view0  
- Duplicidade por assinatura semântica: duplicatas com mesma `data + tipo + conteudo + fonte.sigla`. (Útil para detectar repetição por múltiplas fontes ou ingestões.)

**Granularidade:**
- `%movimentacoes_com_fonte_completa`: presença de `fonte.sigla`, `fonte.tipo`, `fonte.grau`. citeturn14view2turn9view0  
- `%processos_com_capa`: entre fontes TRIBUNAL, proporção com objeto `capa` preenchido. citeturn16view4turn15view3  

## Pipelines analíticos e validação de integridade

### Pipeline sugerido de ingestão e análise

```mermaid
flowchart LR
  A[Entrada: oab_estado, oab_numero, oab_tipo?] --> B[GET /v2/advogado/resumo]
  A --> C[GET /v2/advogado/processos (paginado)]
  C --> D[(Staging: processos_raw)]
  D --> E{Amostragem?}
  E -->|universo| F[GET /v2/processos/numero_cnj/{numero}]
  E -->|estratificada| F
  F --> G[GET /v2/processos/numero_cnj/{numero}/movimentacoes (paginado)]
  F --> H[GET /v2/processos/numero_cnj/{numero}/envolvidos]
  F --> I[GET /v2/.../status-atualizacao]
  I -->|stale| J[POST /v2/.../solicitar-atualizacao]
  J --> K[GET /v2/.../status-atualizacao ou callback]
  G --> L[(DW: fatos_movimentacoes)]
  F --> M[(DW: dim_processos + dim_fontes)]
  H --> N[(DW: dim_envolvidos)]
  L --> O[Qualidade: métricas + score]
  M --> O
  N --> O
  O --> P[Dashboards e alertas]
```

Esse pipeline se alinha ao caráter assíncrono da atualização (quando necessária) e ao uso de `data_ultima_verificacao` como “relógio” de atualidade. citeturn21view0turn25view3turn16view1  

### Exemplo de chamadas (curl) e respostas (trechos reais)

**Listar processos por OAB (v2)** — request real da documentação:

```bash
curl -X GET -G "https://api.escavador.com/api/v2/advogado/processos?oab_estado=SP&oab_numero=123456" \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Requested-With: XMLHttpRequest"
```

citeturn5view1

Trecho real de resposta (campos selecionados; omitido o restante):

```json
{
  "advogado_encontrado": { "nome": "JOÃO DA SILVA", "tipo": "ADVOGADO", "quantidade_processos": 521 },
  "items": [
    {
      "numero_cnj": "0000000-00.2022.2.03.0000",
      "data_inicio": "2023-02-10",
      "data_ultima_movimentacao": "2023-02-10",
      "quantidade_movimentacoes": 1,
      "data_ultima_verificacao": "2023-03-14T18:06:59+00:00",
      "fontes": [ { "sigla": "TSE", "tipo": "TRIBUNAL", "status_predito": "ATIVO" } ]
    }
  ]
}
```

citeturn24view1turn24view2

**Movimentações por CNJ (v2)** — request real da documentação:

```bash
curl -X GET -G "https://api.escavador.com/api/v2/processos/numero_cnj/0018063-19.2013.8.26.0002/movimentacoes" \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Requested-With: XMLHttpRequest"
```

citeturn8view2turn9view0

Trecho real de resposta (campos selecionados):

```json
{
  "items": [
    {
      "id": 853879,
      "data": "2018-07-25",
      "tipo": "ANDAMENTO",
      "conteudo": "CERTIDAO DE CARTORIO EXPEDIDA",
      "fonte": { "sigla": "TJSP", "tipo": "TRIBUNAL", "grau": 1 }
    }
  ],
  "links": { "next": "https://api.escavador.com/.../movimentacoes?cursor=..." },
  "paginator": { "per_page": 20 }
}
```

citeturn9view0turn10view0turn10view1

**Status de atualização (v2)** — request e resposta real:

```bash
curl -X GET -G "https://api.escavador.com/api/v2/processos/numero_cnj/0018063-19.2013.8.26.0002/status-atualizacao" \
  -H "Authorization: Bearer {access_token}" \
  -H "X-Requested-With: XMLHttpRequest"
```

citeturn25view0turn25view2

Trecho real de resposta “sem solicitação”:

```json
{
  "numero_cnj": "0000000-00.0000.0.00.0000",
  "data_ultima_verificacao": "2023-03-02T21:31:56+00:00",
  "tempo_desde_ultima_verificacao": "há 2 meses",
  "ultima_verificacao": null
}
```

citeturn25view2

**Observação sobre lacunas na documentação (transparência):** a doc descreve que `links.next` traz a URL para a próxima página, mas a semântica detalhada de parâmetros como `cursor` e `li` aparece nos exemplos de URL e não como especificação formal; portanto, a interpretação detalhada é **não especificada**. citeturn4view0turn10view0  

### Exemplo de código em Python para coleta e parsing (requests + pandas)

```python
import requests
import pandas as pd

TOKEN = "SEU_TOKEN"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "X-Requested-With": "XMLHttpRequest",
}

def get_json(url, params=None):
    r = requests.get(url, headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def iter_paginado_por_link(next_url):
    """
    A API retorna links.next (URL completa) em vários endpoints.
    Estratégia robusta: seguir a URL fornecida até next == null.
    """
    url = next_url
    while url:
        payload = get_json(url)
        yield payload
        url = payload.get("links", {}).get("next")

# 1) Lista processos por OAB (substituir UF/numero)
base = "https://api.escavador.com/api/v2/advogado/processos"
params = {"oab_estado": "SP", "oab_numero": "123456", "limit": 100}

first = get_json(base, params=params)
pages = [first] + list(iter_paginado_por_link(first.get("links", {}).get("next")))

processos = []
for p in pages:
    processos.extend(p.get("items", []))

df_proc = pd.json_normalize(processos)
print(df_proc[["numero_cnj", "data_inicio", "data_ultima_verificacao", "quantidade_movimentacoes"]].head())
```

Notas técnicas (derivadas da doc):
- `limit` em `/advogado/processos` aceita 50 ou 100. citeturn4view0  
- A paginação expõe `links.next` (URL completa). citeturn4view0turn10view0  

### SQL e Elasticsearch para métricas

A seguir, exemplos de queries pensando em armazenamento relacional (PostgreSQL) e em índice analítico (Elasticsearch/OpenSearch). Ajuste nomes/tipos conforme seu modelo.

**SQL (PostgreSQL) — completude e staleness**

```sql
-- Completeness: % de processos com data_ultima_verificacao preenchida
SELECT
  100.0 * SUM(CASE WHEN data_ultima_verificacao IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) AS pct_com_verificacao
FROM dim_processos;

-- Staleness: distribuição em buckets (em dias)
SELECT
  CASE
    WHEN NOW() - data_ultima_verificacao <= INTERVAL '7 days'  THEN '0-7d'
    WHEN NOW() - data_ultima_verificacao <= INTERVAL '30 days' THEN '8-30d'
    WHEN NOW() - data_ultima_verificacao <= INTERVAL '90 days' THEN '31-90d'
    ELSE '90d+'
  END AS bucket,
  COUNT(*) AS qtd
FROM dim_processos
GROUP BY 1
ORDER BY 1;
```

**SQL — consistência `data_ultima_movimentacao` vs max(movimentacoes)**

```sql
WITH max_mov AS (
  SELECT numero_cnj, MAX(data) AS max_data
  FROM fatos_movimentacoes
  GROUP BY 1
)
SELECT
  p.numero_cnj,
  p.data_ultima_movimentacao,
  m.max_data,
  (p.data_ultima_movimentacao - m.max_data) AS delta_dias
FROM dim_processos p
JOIN max_mov m USING (numero_cnj)
WHERE p.data_ultima_movimentacao IS NOT NULL;
```

**Elasticsearch — agregação por tribunal (fontes.sigla)**  
(Exemplo conceitual; exige indexar `fontes.sigla` como campo agregável.)

```json
GET processos/_search
{
  "size": 0,
  "aggs": {
    "por_tribunal": {
      "terms": { "field": "fontes.sigla.keyword", "size": 50 }
    }
  }
}
```

### Validação e testes de integridade de responses

**Camadas de validação recomendadas:**

1) **HTTP/Contrato**  
   - Status code esperado: 200/401/402/404/422 em determinados endpoints (ex.: documentos-publicos lista 422 “NUMERO_CNJ_INVALIDO”). citeturn35view4turn35view5  
   - Logar headers de custo: `Creditos-Utilizados` (custo em centavos). citeturn33view0  

2) **Schema/tipos (JSON Schema ou validações em runtime)**  
   - Ex.: garantir que `quantidade_movimentacoes` é inteiro; `data_ultima_verificacao` é ISO 8601; `movimentacoes[].data` é `YYYY-MM-DD`. citeturn16view1turn14view1  

3) **Regras de integridade lógica e referencial**  
   - CNJ válido via DV (CNJ exige Módulo 97 Base 10). citeturn30view1turn17view1  
   - `fontes_tribunais_estao_arquivadas` consistente com `status_predito` das fontes TRIBUNAL. citeturn19view0turn16view1  
   - `quantidade_movimentacoes` consistente com contagem extraída após paginação. citeturn16view0turn10view0  

**Implementação prática do DV CNJ (Python)**  
(Implementação alinhada ao Módulo 97 Base 10; o exemplo da doc `0018063-19.2013.8.26.0002` valida com DV=19.)

```python
import re

def cnj_normalizar(cnj: str) -> str:
    # mantém só dígitos
    digits = re.sub(r"\D", "", cnj)
    if len(digits) != 20:
        raise ValueError("CNJ deve ter 20 dígitos (com ou sem pontuação).")
    return digits

def cnj_dd_calculado(digits20: str) -> str:
    """
    CNJ: NNNNNNN DD AAAA J TR OOOO
    ISO 7064 MOD 97-10:
      - mover DD para o final como '00'
      - dv = 98 - (base mod 97)
    """
    n7  = digits20[0:7]
    a4  = digits20[9:13]
    j1  = digits20[13:14]
    tr2 = digits20[14:16]
    o4  = digits20[16:20]
    base = f"{n7}{a4}{j1}{tr2}{o4}00"

    rem = 0
    for ch in base:
        rem = (rem * 10 + int(ch)) % 97
    dv = 98 - rem
    return f"{dv:02d}"

def cnj_validar(cnj: str) -> bool:
    d = cnj_normalizar(cnj)
    dd_informado = d[7:9]
    return dd_informado == cnj_dd_calculado(d)
```

Base normativa: estrutura CNJ e cálculo do DV por Módulo 97 Base 10. citeturn30view1turn17view1  

## Dashboards e insights estratégicos

Um diagnóstico por OAB normalmente gera dois tipos de entregáveis: **(A) painéis de qualidade/saúde** e **(B) painéis de inteligência estratégica** (sobre carteira e dinâmica), sempre deixando explícito que insights dependem da qualidade/atualidade medida.

### Painéis de saúde (data health) recomendados

**Cobertura e completude**
- “Processos retornados vs processos esperados” (`/advogado/resumo` vs dedup de `/advogado/processos`). citeturn4view1turn5view1  
- Heatmap “% com capa completa” por tribunal (`fontes[].capa` presente) e por ano. citeturn16view4turn15view3  

**Atualidade e confiabilidade**
- Histograma/boxplot de `staleness_dias` por tribunal e por status predito. citeturn16view1turn19view0  
- Funil de atualizações: `PENDENTE → SUCESSO/ERRO/NAO_ENCONTRADO`, com tempo médio/p95. citeturn25view3turn21view0  

**Integridade e duplicidades**
- Percentual de CNJs inválidos (DV ou formato) e top causas (422 em endpoints que validam CNJ). citeturn35view4turn35view5turn30view1  
- Taxa de duplicidade de movimentações por “assinatura semântica” (data+tipo+conteúdo+fonte). citeturn14view1turn14view2  

### Painéis estratégicos (exemplos de insights)

**Dinâmica da carteira**
- “Carteira quente”: processos com movimentações nos últimos 7/30 dias, segmentados por tribunal e tipo de movimentação. citeturn9view0turn14view6  
- “Carteira fria/arquivada”: usar `status_predito` por fonte e `fontes_tribunais_estao_arquivadas` (com ressalva de IA). citeturn19view0turn16view1  

**Perfil de temas e unidades**
- Distribuição por `classe`, `assuntos_normalizados`, `orgao_julgador` (quando disponíveis), útil para identificar especialização e concentração de atuação. citeturn16view4turn15view3turn24view3  

**“Risco operacional” de atualização**
- Tribunais/sistemas com maior `error_rate` ou maior tempo de atualização (conforme `status-atualizacao` e callbacks), indicando onde convém usar mais monitoramento e menos atualização on-demand. citeturn25view3turn21view0turn14view6  

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["data quality dashboard example","business intelligence dashboard time series heatmap","ETL pipeline diagram data engineering","legal analytics dashboard court cases"],"num_per_query":1}

### Visualizações e interpretação (exemplos)

**Série temporal de movimentações por semana (OAB)**
- Se houver aumento abrupto de movimentações capturadas, pode significar: (a) pico real de atividade, (b) melhoria de captura pós-atualização, ou (c) mudança de fonte (ex.: inclusão de diário oficial). Diferencie comparando `data_ultima_verificacao` e origem (`fonte.tipo`). citeturn16view1turn14view2  

**Mapa de calor “staleness x tribunal”**
- Um tribunal com staleness sistematicamente alto pode ser gargalo operacional (captcha/indisponibilidade) e deve aumentar a amostragem de verificações e uso de callbacks. A doc v1 e a Central de Ajuda citam explicitamente que o tempo depende do tribunal, captcha e outros fatores. citeturn29view0turn21view0  

## Limitações, cuidados legais e amostragem

### Limitações técnicas e de interpretação

**Heterogeneidade de fontes e normalização**
- O Escavador descreve que coleta dados de fontes oficiais (diários e tribunais) e normaliza informações via algoritmos/IA (ex.: tipos de envolvido, assunto, status). Isso melhora consistência, mas implica que alguns campos são inferidos e podem ter erro. citeturn33view0turn18view0turn19view0  

**Match por CPF/CNPJ e homônimos**
- A Central de Ajuda detalha que, na maioria dos casos, tribunais não fornecem CPF/CNPJ; quando há homônimos, o sistema pode não associar documento e recomenda buscar por nome e filtrar por estado. Isso afeta auditorias de cobertura e a interpretação de “ausência” como “não existe”. citeturn18view0turn10view0  

**Cobertura por diários (v1)**
- A doc v1 afirma explicitamente que a busca de processos por OAB em diários **não garante** retornar todos os processos; portanto use como “sinal complementar”, não como ground truth. citeturn28view0turn27view1  

**Parâmetros não totalmente especificados**
- Alguns detalhes (ex.: semântica completa do cursor/`li`) aparecem como parte de URLs em exemplos e não como especificação formal; ao automatizar, prefira “seguir `links.next`” em vez de construir cursors manualmente. citeturn4view0turn10view0  

### Cuidados legais e privacidade

**LGPD e minimização**
- A LGPD define “dado pessoal” como informação relacionada a pessoa natural identificada ou identificável e descreve “tratamento” como um conjunto amplo de operações (coleta, armazenamento, uso, etc.). Isso se aplica mesmo quando dados são públicos; portanto, pipelines devem adotar minimização, controles de acesso e políticas de retenção. citeturn31view1turn31view2  

**Boas práticas específicas para este caso**
- Trate a identificação de OAB (registro profissional) como dado que pode se tornar pessoal quando ligado a uma pessoa natural; quando possível, use chaves internas e mascaramento em ambientes não produtivos. citeturn31view1  
- Use campos `segredo_justica` e os status de atualização (`NAO_ENCONTRADO` pode ocorrer por segredo) para evitar inferências indevidas e para justificar lacunas de dados. citeturn16view2turn25view3  
- Se for acessar autos/documentos restritos com certificado, a Central de Ajuda descreve uso de certificado A1 (e-CPF) e reforça condições de cadastro no tribunal; isso aumenta responsabilidade de segurança e governança. citeturn20view0turn20view1  

### Recomendações de amostragem para diagnóstico

Quando o volume por OAB for alto, use amostragem estratificada para reduzir custo e tempo sem perder poder diagnóstico:

- **Estratos por tribunal (`fontes[].sigla`)**: garanta cobertura dos tribunais mais frequentes. citeturn16view2turn24view2  
- **Estratos por staleness**: amostre mais em processos com `data_ultima_verificacao` antiga, pois são os que mais “rendem” achados em atualização. citeturn16view1turn21view0  
- **Estratos por status predito**: misture ATIVO/INATIVO e valide consistência com movimentações recentes. citeturn19view0turn16view3  
- **Estratos por ano de início (`ano_inicio`) e classe/assunto** para análises estratégicas (perfil da carteira). citeturn16view0turn24view3  

**Observabilidade de custos e limites**
- A documentação declara limite de 500 requisições/minuto e sugere monitorar custos via header `Creditos-Utilizados`; qualquer outro limite (ex.: rate limit por endpoint) é **não especificado**. citeturn33view0  
- A Central de Ajuda explica a lógica de cobrança por processo em janela de 24h (paga-se, no máximo, a diferença até o serviço mais caro utilizado no período), o que impacta estratégia de amostragem e reconsulta. citeturn19view1