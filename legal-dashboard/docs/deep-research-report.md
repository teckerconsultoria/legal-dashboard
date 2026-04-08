# Homepage de Painéis de Saúde e Insights usando a API do Escavador e prototipação no Figma

## Resumo executivo

Este relatório detalha como usar a API do Escavador (prioridade na versão v2) para **prototipar a homepage** de dois produtos complementares: **Painéis de Saúde dos Dados (data health)** e **Painéis Estratégicos (insights)**, ambos centrados em um **OAB alvo não especificado** (portanto, a homepage deve começar por um seletor de OAB). A proposta cobre: requisitos funcionais e conteúdo, mapa de telas e componentes, especificação de dados por widget com endpoints e parâmetros, exemplos de chamadas (curl) e parsing (Python), guidelines de UX para métricas de qualidade e conformidade com LGPD, checklist de testes e validações de integridade, além de uma estimativa de esforço para protótipo e MVP. citeturn20view1turn24view0turn28view0turn21view0turn22view0

A API v2 fornece rotas diretas para **processos por OAB** — incluindo **resumo do advogado** e **lista paginada de processos** — e rotas por **número CNJ** para obter **capa**, **movimentações**, **documentos públicos**, **envolvidos** e **status/solicitação de atualização** (assíncrona). Esses endpoints suportam a maior parte dos cartões/KPIs, tabelas e drill-downs necessários, mas métricas agregadas de saúde (ex.: “% desatualizados”, “taxa de erro de atualização”, “duplicidade”) precisam ser **calculadas numa camada analítica** (backend/ETL), com **amostragem e cache** para controlar custo e volume. citeturn24view0turn25view1turn25view2turn28view3turn29view2

Sobre prototipação: os conectores disponíveis nesta sessão permitiram **acesso de leitura ao Figma** (sem criação/edição automatizada de arquivos), e uma tentativa de geração automática de diagrama foi bloqueada; por isso, o **link de visualização do protótipo gerado automaticamente** fica como **“não especificado”**. Em compensação, o relatório entrega um blueprint completo (IA + dados + UX) com **wireframes descritivos**, **mermaid** e **especificações de componentes** diretamente aplicáveis em um arquivo Figma criado manualmente. 

## Fontes consultadas e escopo de documentação

### Conectores usados no início

- Conector Figma: autenticado, mas com permissão de leitura (não disponível para criação/edição automatizada de telas nesta sessão).  
- Conector Google Drive: buscas exploratórias não retornaram ativos/documentos diretamente úteis para este protótipo (nenhum conteúdo interno relevante foi utilizado no relatório).

### URLs do Escavador consultadas (inclui exatamente as URLs fornecidas)

> Observação: URLs são listadas em bloco de código para manter o relatório compatível com a regra de não exibir URLs “cruas” fora de código.

```text
# URLs fornecidas pelo usuário (consultadas)
https://www.escavador.com/                          (ok)         [turn19view0]
https://www.escavador.com/api                       (erro fetch)  [turn19view1]
https://www.escavador.com/api/documentacao          (404)         [turn19view2]
https://www.escavador.com/api/v1/processos          (404)         [turn19view3]
https://www.escavador.com/api/v1/movimentacoes      (404)         [turn19view4]

# Documentação e páginas oficiais do Escavador consultadas
https://api.escavador.com/                          [turn20view0]
https://api.escavador.com/v2/docs/                  [turn20view1]
https://api.escavador.com/v1/docs/                  [turn20view2]

# Central de ajuda / suporte oficial da API (Escavador)
https://suporte-api.escavador.com/hc/pt-br/articles/37240565233051-Como-atualizar-um-processo-pela-API-v2      [turn21view0]
https://suporte-api.escavador.com/hc/pt-br/articles/20302078660379-Relat%C3%B3rio-de-consumo-API                [turn21view1]
https://suporte-api.escavador.com/hc/pt-br/articles/29095036394651-Como-identificar-se-um-processo-est%C3%A1-ativo-ou-inativo-na-API-do-Escavador [turn22view0]
https://suporte-api.escavador.com/hc/pt-br/articles/27682373298331-Como-funciona-a-cobran%C3%A7a-do-processo-na-v2 [turn22view1]
https://suporte-api.escavador.com/hc/pt-br/articles/16486878217883-Novas-rotas-de-busca-na-API-v2               [turn22view2]
https://suporte-api.escavador.com/hc/pt-br/articles/13916942181915-O-Algoritmo-de-Match-na-API-do-Escavador     [turn22view3]

# GitHub oficial (Escavador) consultado
https://github.com/Escavador/escavador-python        [turn17view0]
```

### Outras fontes oficiais brasileiras consultadas (CNJ e LGPD)

```text
# CNJ (numeração única / CNJ)
https://atos.cnj.jus.br/atos/detalhar/atos-normativos?documento=119   [turn15view0]

# LGPD (texto legal e material oficial)
https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-publicacaooriginal-156212-pl.html  [turn16view0..turn16view3]
https://www.gov.br/mds/pt-br/acesso-a-informacao/governanca/integridade/campanhas/lgpd                            [turn16view4..turn16view6]
```

## Requisitos funcionais e arquitetura de informação da homepage

### Objetivo da homepage e jornada primária

A homepage deve funcionar como **painel de comando**: o usuário informa uma OAB (UF + número + tipo opcional), e a experiência se divide em duas abas no conteúdo principal:

- **Painel de Saúde (data health)**: “Quão confiável, completa, consistente e atual está a carteira de processos desta OAB?”
- **Painel Estratégico (insights)**: “O que dá para aprender (tendências, distribuição, priorização) com essa carteira?”

O motivo do **seletor de OAB** ser o primeiro elemento é que a API v2 oferece rotas específicas “por OAB” (resumo e processos). citeturn24view0turn26view0turn22view2

### Requisitos funcionais de conteúdo (widgets, filtros, alertas, drill-down)

Abaixo está um conjunto **mínimo porém completo** de funcionalidades para prototipar a homepage. Onde valores dependem de política interna (ex.: thresholds) ou rotas não entregam agregados prontos, o protótipo deve explicitar “calculado” e/ou “baseado em amostra”.

**Filtros globais (topo da homepage)**  
- OAB: `oab_estado` (obrigatório), `oab_numero` (obrigatório), `oab_tipo` (opcional). citeturn26view0turn24view0  
- Tribunais (siglas): array `tribunais[]` para filtrar a lista. citeturn24view1  
- Status do processo: `status=ATIVO|INATIVO` (classificação por IA). citeturn24view1turn22view0  
- Período de início do processo: `data_minima`, `data_maxima` (AAAA-MM-DD). citeturn24view1  
- Modo de amostragem (recomendado na UI): “Amostra rápida (100)” vs “Completo (pode demorar)”. (Cálculo/UX proposto; não especificado pela API.)

**Widgets do Painel de Saúde (data health)**  
- KPI: Total de processos da OAB (“carteira”). citeturn26view0turn23view1  
- KPI: % processos com verificação recente vs antiga (derivado do `data_ultima_verificacao`/status). citeturn28view3turn21view0  
- KPI: fila de atualização (pendente/sucesso/erro/não encontrado). citeturn28view4turn29view0  
- Gráfico: distribuição de “staleness” (dias desde última verificação). citeturn28view3turn21view0  
- Tabela “processos mais críticos” (stale alto + alto volume de movimentação). citeturn25view2turn24view1  
- Alertas: falta de crédito (402), autenticação inválida (401), CNJ inválido (422), processo não encontrado (status/NAO_ENCONTRADO). citeturn24view0turn26view3turn29view0

**Widgets do Painel Estratégico (insights)**  
- Série temporal: novas movimentações por dia/semana (amostra ou completo). citeturn25view2turn25view3  
- Distribuição por tribunal e grau (com base nas fontes das movimentações e/ou fontes do processo). citeturn25view2turn22view0  
- “Top temas”: assunto/classe/vara quando disponíveis (depende do payload da capa do processo). citeturn25view1  
- “Ritmo da carteira”: processos quentes (muitas movimentações em 30 dias) vs frios (sem movimentações). citeturn25view2  
- “Top contrapartes / envolvidos recorrentes” (com mascaramento LGPD). citeturn30view0turn16view0

**Drill-down (componente transversal às duas abas)**  
- Clique em tribunal/segmento → Lista filtrada de processos (`advogado/processos` com `tribunais[]`). citeturn24view1  
- Clique em processo → “Detalhe do processo” (drawer ou tela): capa (`processos/numero_cnj/{numero}`), movimentações, envolvidos, documentos públicos, status e ação “Solicitar atualização”. citeturn25view1turn25view2turn30view0turn29view2turn28view3

### Mapa de telas e componentes

```mermaid
flowchart TD
  A[Homepage] --> B[Seletor de OAB + Filtros globais]
  B --> C[Painel de Saúde]
  B --> D[Painel Estratégico]
  C --> E[Tabela de processos críticos]
  D --> E
  E --> F[Detalhe do processo (drawer/tela)]
  F --> G[Capa do processo]
  F --> H[Movimentações]
  F --> I[Envolvidos]
  F --> J[Documentos públicos]
  F --> K[Status de atualização + Ação "Solicitar atualização"]
```

As telas “Detalhe do processo” e “Configurações” são essenciais porque parte relevante da saúde depende de **atualização assíncrona**: você dispara atualização, acompanha status, e só então reconsulta dados atualizados. citeturn29view0turn28view3turn21view0

## Especificações de dados por componente e endpoints recomendados

### Autenticação, headers e limites observáveis

A documentação v2 descreve autenticação via **Bearer Token** no header `Authorization`. citeturn28view0turn20view1  
A maioria dos exemplos inclui também `X-Requested-With: XMLHttpRequest`. citeturn24view0turn25view1turn29view2  
O custo por request pode ser exposto no header `Creditos-Utilizados`. citeturn20view1  
Limite de requisições documentado: **500 requisições por minuto**. citeturn20view1  

Para callbacks: a doc orienta criar token de validação e afirma que o token é enviado pelo header `Authorization`. citeturn28view1  

### Tabela comparativa de widgets vs endpoints

| Widget (homepage) | Finalidade | Endpoint(s) (URL) | Parâmetros recomendados | Observações de implementação |
|---|---|---|---|---|
| KPI “Total de processos” | Tamanho da carteira | `https://api.escavador.com/api/v2/advogado/resumo` | `oab_estado`, `oab_numero`, `oab_tipo` (opt.) | Retorna `quantidade_processos`. citeturn26view0turn23view1 |
| Tabela “Processos da OAB” | Lista para drill-down | `https://api.escavador.com/api/v2/advogado/processos` | `oab_estado`, `oab_numero`, `oab_tipo` (opt.), `limit` (50/100), `tribunais[]`, `status`, `data_minima`, `data_maxima` | Resposta paginada com `links.next` (cursor). Não há “total” no exemplo (planejar amostragem/caching). citeturn24view0turn24view1 |
| KPI “Ativo/Inativo” | Saúde operacional da carteira | `processos/numero_cnj/{numero}` (por processo) | CNJ | Status geral pode ser inferido por `status_predito` e `fontes_tribunais_estao_arquivadas` (IA). citeturn22view0 |
| KPI “Staleness” | Atualidade dos dados | `processos/numero_cnj/{numero}/status-atualizacao` | CNJ | Retorna `data_ultima_verificacao` + última solicitação (`ultima_verificacao`). citeturn28view3turn29view0turn21view0 |
| Ação “Solicitar atualização” | Atualizar no tribunal | `processos/numero_cnj/{numero}/solicitar-atualizacao` (POST) | Body: `enviar_callback`, `documentos_publicos`, `autos`, `utilizar_certificado`, `usuario`, `senha`… | Assíncrono; acompanhar via status. `autos=1` exige autenticação. citeturn29view2turn29view3 |
| Timeline de movimentações | Insights + saúde | `processos/numero_cnj/{numero}/movimentacoes` | `limit` 50/100/500 | Itens trazem `data`, `tipo`, `conteudo`, `fonte`. citeturn25view2turn25view3 |
| Documentos públicos | Evidências/insights | `processos/numero_cnj/{numero}/documentos-publicos` | `limit` 50/100 | Se precisar baixar docs, usar atualização com `documentos_publicos=1`. citeturn26view0turn26view3 |
| Envolvidos | Partes/contrapartes | `processos/numero_cnj/{numero}/envolvidos` | `limit` 50/100 | Útil para “top contrapartes”, com mascaramento por LGPD. citeturn30view0turn16view0 |
| Feed de eventos (opcional) | Alertas e “novos processos” | `monitoramentos/novos-processos` + callbacks | Body: `termo`, `variacoes`, `termos_auxiliares`, `tribunais` | Callback de `novo_processo` e política de reentrega (11 tentativas). citeturn30view1turn30view4 |

### Mapa detalhado de campos relevantes (campos → significado → uso no dashboard)

Abaixo, um “mapa de campos” focado no que alimenta KPIs, filtros e gráficos. Campos fora desse escopo (ex.: conteúdo jurídico integral) são intencionalmente omitidos.

| Endpoint | Campo | Significado (documentado) | Uso sugerido na UI |
|---|---|---|---|
| `advogado/resumo` | `nome` | Nome do advogado (a partir da OAB consultada) | Header do painel (“Carteira de …”). citeturn26view0turn23view1 |
| `advogado/resumo` | `tipo` | Tipo da OAB / vínculo (ex.: ADVOGADO) | Badge de contexto. citeturn26view0turn24view1 |
| `advogado/resumo` | `quantidade_processos` | Total na base para aquela OAB | KPI principal da homepage. citeturn26view0 |
| `advogado/processos` | `items[]` | Lista de processos encontrados | Base da tabela e amostragem. citeturn24view0turn24view1 |
| `advogado/processos` | `links.next` | URL (com cursor) para próxima página | Scroll/paginação e jobs de ingestão. citeturn24view0 |
| `advogado/processos` | `paginator.per_page` | Tamanho de página | UX “carregando mais”. citeturn24view0 |
| `processos/numero_cnj/{numero}` | `numero` (CNJ) | Identificador CNJ aceitando formato com/sem máscara | Chave primária e link para detalhe. citeturn25view1turn15view0 |
| `processos/numero_cnj/{numero}` | (campos de fontes) | Fontes de tribunal e atributos como status predito | KPI Ativo/Inativo e cobertura por tribunal. citeturn22view0turn25view1 |
| `…/movimentacoes` | `items[].data` | Data da movimentação | Série temporal, latência, recência. citeturn25view2turn25view3 |
| `…/movimentacoes` | `items[].tipo` | Tipo (ex.: ANDAMENTO) | Taxonomia de eventos (heatmap). citeturn25view2 |
| `…/movimentacoes` | `items[].conteudo` | Texto do andamento/movimentação | Nuvem de termos / tópicos (com cuidado LGPD). citeturn25view2turn16view0 |
| `…/movimentacoes` | `items[].fonte.sigla` | Sigla do tribunal (ex.: TJSP) | Distribuição por tribunal + drill-down. citeturn25view2 |
| `…/status-atualizacao` | `data_ultima_verificacao` | Última vez que robôs verificaram sistemas | KPI “desatualizados”, semáforo. citeturn28view3turn21view0 |
| `…/status-atualizacao` | `tempo_desde_ultima_verificacao` | Texto (“há X…”) | Microcopy e tooltip. citeturn28view3 |
| `…/status-atualizacao` | `ultima_verificacao.status` | Status do job (PENDENTE, SUCESSO etc.) | Painel de fila e alertas. citeturn28view3turn29view0 |
| `…/solicitar-atualizacao` | `id` | ID da solicitação | Correlacionar job com status e auditoria. citeturn29view2 |
| `…/solicitar-atualizacao` | Body `documentos_publicos` | Baixar docs públicos na atualização | Toggle “incluir documentos públicos” + custo. citeturn29view2turn22view1 |
| `…/solicitar-atualizacao` | Body `autos` | Baixar autos completos (restritos) | Feature sob permissão + credenciais. citeturn29view3turn26view4 |

### Exemplos de requests (curl) e parsing (Python) por widget

A seguir, exemplos **práticos** (adaptados para protótipo) alinhados à documentação v2.

#### KPI “Total de processos” (advogado/resumo)

**curl**
```bash
curl -G "https://api.escavador.com/api/v2/advogado/resumo" \
  --data-urlencode "oab_estado=SP" \
  --data-urlencode "oab_numero=123456" \
  -H "Authorization: Bearer $ESCAVADOR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest"
```
Parâmetros e headers estão documentados. citeturn26view0turn24view1

**Python (requests)**
```python
import os, requests

BASE = "https://api.escavador.com/api/v2"
token = os.environ["ESCAVADOR_TOKEN"]

resp = requests.get(
    f"{BASE}/advogado/resumo",
    params={"oab_estado": "SP", "oab_numero": "123456"},
    headers={"Authorization": f"Bearer {token}", "X-Requested-With": "XMLHttpRequest"},
    timeout=30,
)
resp.raise_for_status()
data = resp.json()
kpi_total = data.get("quantidade_processos")
print("Total processos:", kpi_total)
```
O payload de exemplo inclui `quantidade_processos`. citeturn26view0turn23view1

#### Tabela “Processos da OAB” (advogado/processos) com filtros

**curl**
```bash
curl -G "https://api.escavador.com/api/v2/advogado/processos" \
  --data-urlencode "oab_estado=SP" \
  --data-urlencode "oab_numero=123456" \
  --data-urlencode "limit=100" \
  --data-urlencode "status=ATIVO" \
  --data-urlencode "data_minima=2023-01-01" \
  --data-urlencode "data_maxima=2026-01-01" \
  --data-urlencode "tribunais[]=TJSP" \
  --data-urlencode "tribunais[]=TJMG" \
  -H "Authorization: Bearer $ESCAVADOR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest"
```
Parâmetros `limit`, `tribunais[]`, `status`, `data_minima`, `data_maxima` constam na doc. citeturn24view1turn24view0

**Python (paginação via links.next)**  
O exemplo da doc mostra `links.next` com cursor. citeturn24view0
```python
import os, requests

BASE = "https://api.escavador.com/api/v2"
token = os.environ["ESCAVADOR_TOKEN"]
headers = {"Authorization": f"Bearer {token}", "X-Requested-With": "XMLHttpRequest"}

params = {"oab_estado": "SP", "oab_numero": "123456", "limit": 100}

url = f"{BASE}/advogado/processos"
all_items = []

for _ in range(3):  # protótipo: limitar páginas (amostra)
    r = requests.get(url, params=params, headers=headers, timeout=60)
    r.raise_for_status()
    payload = r.json()

    items = payload.get("items", [])
    all_items.extend(items)

    next_link = (payload.get("links") or {}).get("next")
    if not next_link:
        break
    # Para amostragem, a forma mais simples é seguir o "next" diretamente:
    url, params = next_link, None

print("Processos (amostra):", len(all_items))
```

#### Tela “Detalhe do processo” (capa + status + movimentações)

**curl (capa do processo por CNJ)**  
O endpoint aceita CNJ com/sem máscara (20 dígitos). citeturn25view1turn15view0
```bash
curl -G "https://api.escavador.com/api/v2/processos/numero_cnj/0018063-19.2013.8.26.0002" \
  -H "Authorization: Bearer $ESCAVADOR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest"
```

**curl (status de atualização)**  
O status retorna `data_ultima_verificacao` e `ultima_verificacao` (se houver solicitação). citeturn28view3turn29view0
```bash
curl -G "https://api.escavador.com/api/v2/processos/numero_cnj/0018063-19.2013.8.26.0002/status-atualizacao" \
  -H "Authorization: Bearer $ESCAVADOR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest"
```

**curl (movimentações)**  
Parâmetro `limit` pode ser 50/100/500. citeturn25view2turn25view3
```bash
curl -G "https://api.escavador.com/api/v2/processos/numero_cnj/0018063-19.2013.8.26.0002/movimentacoes" \
  --data-urlencode "limit=500" \
  -H "Authorization: Bearer $ESCAVADOR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest"
```

**Python (montar “view model” do detalhe para o frontend)**  
```python
import os, requests
from datetime import datetime, timezone

BASE = "https://api.escavador.com/api/v2"
token = os.environ["ESCAVADOR_TOKEN"]
H = {"Authorization": f"Bearer {token}", "X-Requested-With": "XMLHttpRequest"}

def get_json(url, params=None, method="GET", json_body=None):
    r = requests.request(method, url, params=params, json=json_body, headers=H, timeout=60)
    r.raise_for_status()
    return r.json()

cnj = "0018063-19.2013.8.26.0002"

capa = get_json(f"{BASE}/processos/numero_cnj/{cnj}")
status = get_json(f"{BASE}/processos/numero_cnj/{cnj}/status-atualizacao")

mov = get_json(f"{BASE}/processos/numero_cnj/{cnj}/movimentacoes", params={"limit": 100}).get("items", [])

last_check = status.get("data_ultima_verificacao")
stale_days = None
if last_check:
    dt = datetime.fromisoformat(last_check.replace("Z", "+00:00"))
    stale_days = (datetime.now(timezone.utc) - dt).days

view_model = {
    "cnj": cnj,
    "stale_days": stale_days,
    "ultima_verificacao_status": (status.get("ultima_verificacao") or {}).get("status"),
    "movimentacoes_top10": mov[:10],
    "capa_raw": capa,  # protótipo: front pode reduzir campos
}

print(view_model["cnj"], view_model["stale_days"], view_model["ultima_verificacao_status"])
```

#### Ação “Solicitar atualização” (assíncrona) e tratamento de status

A doc descreve que o endpoint de status pode retornar quatro estados: `PENDENTE`, `SUCESSO`, `NAO_ENCONTRADO`, `ERRO`. citeturn29view0turn29view1  
E o suporte explica que `data_ultima_verificacao` ajuda a decidir quando atualizar. citeturn21view0

**curl (POST solicitar atualização)**  
Body parameters relevantes incluem `enviar_callback`, `documentos_publicos` e `autos`. citeturn29view2turn29view3
```bash
curl -X POST "https://api.escavador.com/api/v2/processos/numero_cnj/0018063-19.2013.8.26.0002/solicitar-atualizacao" \
  -H "Authorization: Bearer $ESCAVADOR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Content-Type: application/json" \
  -d '{"enviar_callback": 1, "documentos_publicos": 1}'
```

> Nota de consistência: um artigo de suporte menciona `send_callback=1`, enquanto a documentação v2 usa `enviar_callback=1`. Para protótipo, exiba o nome conforme a documentação v2 e trate o do artigo como possível variação histórica. citeturn21view0turn29view2

### Tabela comparativa de métricas de saúde e como calcular

As métricas abaixo são projetadas para serem computadas na sua camada analítica (SQL/Elasticsearch/Python). Onde dependem de jobs assíncronos, a UI deve claramente diferenciar “estado do dado” vs “estado do job”.

| Dimensão | Métrica | Definição prática | Fonte de dado | Regra/threshold sugerido (UX) |
|---|---|---|---|---|
| Completude | % processos com CNJ válido | CNJ no padrão NNNNNNN-DD.AAAA.J.TR.OOOO | CNJ é padrão CNJ; API retorna 422 se inválido em rotas de CNJ | Verde ≥ 99%, Amarelo 95–99%, Vermelho < 95% (recomendação) citeturn15view0turn26view3 |
| Atualidade | “Staleness p50/p90” | Dias desde `data_ultima_verificacao` | `status-atualizacao` e/ou campo do processo | Verde p90 ≤ 7d, Amarelo 8–30d, Vermelho > 30d (recomendação) citeturn28view3turn21view0 |
| Consistência | Divergência “ativo/inativo” | `fontes_tribunais_estao_arquivadas=false` mas todas fontes com `status_predito=INATIVO` (ou vice-versa) | `processos/numero_cnj/{numero}` | Alertar para revisão (IA). citeturn22view0turn25view1 |
| Duplicidade | CNJ repetido na carteira | Mesmo CNJ aparecendo múltiplas vezes na ingestão | `advogado/processos` | Deduplicar por CNJ e manter fontes como array. citeturn24view0turn25view1 |
| Cobertura | Processos por tribunal | `count_by(fonte.sigla)` | `movimentacoes[].fonte` e/ou fontes do processo | Heatmap por tribunal × recência. citeturn25view2 |
| Ritmo | Movimentações / 30 dias | total de movimentações no período / processos | `movimentacoes` | “Carteira quente” = p90 de ritmo. citeturn25view2 |
| Latência | Gap médio entre movimentações | média de dias entre eventos consecutivos | `movimentacoes[].data` | Útil para SLA e “risco operacional”. citeturn25view2 |
| Robustez | Taxa `ERRO` na atualização | % jobs com status `ERRO` | `status-atualizacao` + histórico de solicitações | Se > X% (definir), abrir incidente (recomendação). citeturn29view0turn28view3 |
| Custo | Custo por carteira | somatório de `Creditos-Utilizados` (centavos) | header `Creditos-Utilizados` + relatório do painel | Expor custo estimado e “top endpoints”. citeturn20view1turn21view1 |

## Diretrizes de UX, LGPD e leitura de métricas de qualidade

### Paleta semântica e microcopy para “data health”

Para data health, a UI deve **ensinar o usuário** a interpretar cada métrica:

- Sempre que exibir “Atualizado há X”, oferecer tooltip: “Baseado em `data_ultima_verificacao` (última visita dos robôs ao tribunal)”. citeturn28view3turn21view0  
- Ao exibir “Ativo/Inativo”, explicar que é **classificação por IA** (`status_predito`) e que o status global deriva de `fontes_tribunais_estao_arquivadas`. citeturn22view0turn24view1  
- Ao exibir “Não encontrado”, usar a explicação documentada (processo físico, segredo de justiça, arquivado etc.). citeturn29view0  

### Permissões e mascaramento por LGPD

A LGPD define “dado pessoal” como informação relacionada a pessoa natural identificada ou identificável, e também define dado pessoal sensível e obrigações de segurança. citeturn16view0turn16view3  
A mesma lei estabelece princípios como **necessidade** (mínimo necessário) e **qualidade dos dados** (exatidão, clareza, relevância e atualização). citeturn16view1turn16view2  
Materiais oficiais reforçam o conjunto de princípios (finalidade, adequação, necessidade, qualidade etc.). citeturn16view4  

**Recomendação de controles para o protótipo (comportamento esperado no produto):**
- Perfis: “Admin”, “Analista”, “Somente leitura”, “Auditoria”. (não especificado pela API; é do seu produto)
- Mascaramento padrão:
  - CPFs/CNPJs: mostrar apenas sufixo/prefixo (ex.: `***.***.***-**`), com opção de revelar apenas para perfis específicos, registrando auditoria.
  - Nomes de pessoas físicas: reduzir a iniciais em agregados; no detalhe do processo, controlar exibição por perfil.
- Consentimento/explicabilidade: rotular “classificação por IA” e permitir contestação/revisão interna para decisões baseadas só em IA (recomendação; a API indica uso de IA para status). citeturn22view0turn24view1  

### Imagens de referência para UI de dashboards

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["data quality dashboard KPI cards","health dashboard time series heatmap","dashboard drilldown table drawer UI"],"num_per_query":1}

## Checklist de validação, testes e estimativa de esforço

### Checklist de testes e validação de integridade dos responses

**Validação de protocolo / autenticação**
- Verificar presença/forma do header `Authorization: Bearer …` e tratamento de 401. citeturn28view0turn26view0  
- Registrar e somar header `Creditos-Utilizados` (quando presente) para estimar custo (auditoria). citeturn20view1  
- Aplicar rate limiting client-side (token bucket) para respeitar 500 req/min e evitar saturação. citeturn20view1  

**Validação semântica**
- Validar CNJ no padrão do CNJ antes de chamar rotas por CNJ; a própria API pode responder `NUMERO_CNJ_INVALIDO` (422) em rotas relacionadas a CNJ (ex.: documentos públicos). citeturn15view0turn26view3  
- Em `status-atualizacao`, validar coerência:
  - Se `ultima_verificacao` existe, `status` ∈ {PENDENTE, SUCESSO, NAO_ENCONTRADO, ERRO}. citeturn29view0turn29view1  
  - Se `status=SUCESSO`, então `concluido_em` deve estar presente (quando fornecido). citeturn28view4turn28view3  

**Validação de paginação**
- Para endpoints com `links.next`, testar: (a) loop de paginação, (b) deduplicação por CNJ, (c) limites de amostragem. citeturn24view0turn25view2  

**Observabilidade**
- Registrar erros 402 (“sem saldo”), 404 (“NotFound/NOT_FOUND”), 422 (CNJ inválido), e a taxa de retorno `NAO_ENCONTRADO`/`ERRO` em atualizações. citeturn24view0turn26view3turn29view0  

### Estratégia de amostragem recomendada

Como `advogado/processos` é paginado e a carteira pode ser grande, o protótipo deve expor explicitamente um modo “Amostra”:

- **Amostra rápida**: 1–3 páginas (até 300 processos se `limit=100`) para calcular métricas aproximadas e representar dashboards com latência aceitável.
- **Completo**: job server-side (ETL) que varre toda a paginação e atualiza cubos/índices.

A UI deve deixar visível “Baseado em amostra N” quando aplicável. (Recomendação de produto; paginação e `limit` estão documentados.) citeturn24view0turn24view1  

### Estimativa de esforço

**Protótipo (Figma) — homepage + detalhe + componentes reutilizáveis**
- Arquitetura de informação, wireframes e componentes principais: 10–14h  
- Alta fidelidade (grid, tipografia, estados vazios/loading/erro, tokens semânticos): 12–18h  
- Interações (tabs, filtros, drill-down, drawer): 6–10h  
- Total protótipo: **28–42h**

**MVP implementável (frontend + backend mínimo + jobs)**
- Backend (staging + ingestão paginada + cache + métricas): 40–70h  
- Jobs assíncronos de atualização + status + fila: 30–60h citeturn29view2turn28view3turn21view0  
- Frontend (homepage + detalhe + gráficos + permissões básicas): 60–110h  
- Observabilidade + auditoria + custo: 16–30h citeturn20view1turn21view1  
- Total MVP: **146–270h** (varia com stack, padrões internos, e volume real da carteira)

### Protótipo no Figma e link de visualização

- Link de visualização do protótipo gerado automaticamente via conector nesta sessão: **não especificado** (criação automatizada não disponível/foi bloqueada nesta execução).
- Para criar manualmente no Figma (recomendação pragmática):
  1. Criar arquivo “Home — Painéis (Saúde + Insights)”.
  2. Montar **Frame 1440** com grid 12 colunas.
  3. Criar componentes: TopBar + OABPicker + FilterChips + KPI Card + Table + Drawer.
  4. Conectar abas (Saúde / Insights) e o drawer de detalhe.
  5. Inserir textos de microcopy com referências diretas aos campos `data_ultima_verificacao`, `status_predito` e aos estados do job (PENDENTE/SUCESSO/ERRO/NAO_ENCONTRADO). citeturn28view3turn22view0turn29view0