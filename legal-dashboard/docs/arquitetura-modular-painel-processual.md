# Arquitetura Modular por Tier — Painel de Inteligência Processual

**Produto:** Painel de Saúde e Insights de Carteira Processual por OAB  
**Base de dados:** API Escavador v2  
**Versão:** 1.0  
**Data:** Abril de 2026

---

## Visão Geral

O produto é um painel analítico que transforma dados processuais brutos — obtidos via API do Escavador — em inteligência operacional e estratégica para advogados e gestores jurídicos. Seu diferencial não é o acesso aos dados em si, mas a camada de diagnóstico, priorização e governança construída sobre eles.

A arquitetura modular foi concebida para atender perfis distintos sem forçar uma solução única. Cada tier herda as funcionalidades do anterior e adiciona uma camada de inteligência ou gestão proporcional à complexidade do público-alvo. Isso cria uma progressão natural de valor — e um caminho de upsell orgânico à medida que o cliente cresce.

---

## Princípio de Empilhamento

```
Tier 4 — Diagnóstico Estratégico
  └── Tier 3 — Inteligência de Escritório
        └── Tier 2 — Carteira Inteligente       ← MVP recomendado
              └── Tier 1 — Solo Essencial
```

Cada tier resolve um problema mais complexo para um perfil com maior capacidade de investimento e maior senso de urgência para inteligência de dados.

---

## Tier 1 — Solo Essencial

**Público-alvo:** Advogado autônomo com carteira de baixo a médio volume, sem equipe de suporte.

**Proposta de valor:** Clareza sobre o estado da carteira sem a necessidade de entrar processo por processo. O produto substitui o monitoramento manual por um painel de status simples e confiável.

### Funcionalidades

O tier é acessado via seletor de OAB (UF + número), que retorna imediatamente um resumo da carteira com base no endpoint `/api/v2/advogado/resumo`. A partir daí, o usuário visualiza a lista de processos com indicadores visuais de atualidade — verde para processos verificados recentemente, amarelo para verificações com mais de sete dias, vermelho para mais de trinta dias — derivados do campo `data_ultima_verificacao`.

Três KPIs compõem o painel principal: total de processos na carteira, percentual de processos atualizados, e contagem de processos críticos (staleness alto). Um módulo de alertas simples sinaliza processos sem movimentação recente. A exportação em PDF ou CSV está disponível para uso em relatórios próprios ou prestação de contas a clientes.

### O que este tier não faz

Não agrega dados por tribunal, não calcula tendências temporais, não compara períodos. A complexidade analítica é deliberadamente removida para manter a curva de adoção baixa e o produto acessível a usuários sem familiaridade com ferramentas de BI.

### Infraestrutura mínima necessária

Consultas diretas à API Escavador sem camada analítica intermediária. Cache simples para controle de custo de créditos. Sem necessidade de ETL ou jobs assíncronos.

---

## Tier 2 — Carteira Inteligente

**Público-alvo:** Advogado com volume médio de processos ou sócio de escritório pequeno que também opera sua própria carteira.

**Proposta de valor:** Priorização inteligente. O usuário não quer apenas saber o que está desatualizado — quer saber onde focar primeiro e como a carteira está se comportando ao longo do tempo.

### Funcionalidades adicionais ao Tier 1

O painel de saúde é expandido com distribuição da carteira por tribunal e grau, e com um histograma de staleness que permite identificar concentrações de risco operacional. A categorização da carteira em "quente" (processos com alta frequência de movimentações recentes) e "fria" (processos sem atividade nos últimos trinta dias) oferece ao usuário uma visão de prioridade imediata.

Uma série temporal de movimentações por semana introduz a dimensão de tendência, permitindo identificar picos de atividade e gargalos por tribunal. O drill-down por processo exibe o histórico completo de movimentações com paginação via cursor. O funil de atualizações — PENDENTE → SUCESSO / ERRO / NÃO ENCONTRADO — expõe a confiabilidade operacional da ingestão de dados por tribunal.

Para carteiras grandes, a interface implementa amostragem estratificada com indicação explícita de quando os dados exibidos são baseados em amostra, junto ao tamanho da amostra utilizada.

### Diferença essencial em relação ao Tier 1

O usuário começa a tomar decisões baseadas em padrões e tendências, não apenas em status individuais de processos. A ferramenta deixa de ser um painel de monitoramento e passa a ser um instrumento de priorização.

### Infraestrutura necessária

Backend com camada analítica leve para cálculo de métricas agregadas (staleness, distribuição, ritmo). Jobs assíncronos para solicitação e acompanhamento de atualizações via `POST /solicitar-atualizacao` e `GET /status-atualizacao`. Cache com política de expiração por tribunal.

---

## Tier 3 — Inteligência de Escritório

**Público-alvo:** Sócio gestor ou coordenador de área em escritório de médio porte. Perfil que precisa de visibilidade sobre múltiplos advogados e múltiplas carteiras simultaneamente.

**Proposta de valor:** Governança e gestão. O gestor precisa saber como está a saúde de toda a operação — não apenas da sua própria carteira — e precisa de rastreabilidade para tomar decisões sobre alocação de recursos e prestação de contas.

### Funcionalidades adicionais ao Tier 2

O painel passa a suportar múltiplas OABs em uma visão consolidada, com comparação de indicadores entre advogados: volume de carteira, ritmo de movimentações, taxa de processos críticos e taxa de erro de atualização. Um heatmap cruza tribunal × advogado responsável para identificar onde a cobertura é fraca ou onde o risco operacional está concentrado.

O sistema de alertas torna-se configurável por limiar: o gestor define, por exemplo, que deseja ser notificado quando o staleness p90 de um determinado tribunal ultrapassar quinze dias, ou quando a taxa de erro de atualização de um advogado específico superar um percentual definido.

O controle de acesso por perfil — Admin, Analista, Somente Leitura e Auditoria — é introduzido neste tier, junto ao log de auditoria com rastreabilidade de consultas. Ambos são requisitos diretos de conformidade com a LGPD, especialmente para o tratamento de dados de partes processuais e CPFs.

### Diferença essencial em relação ao Tier 2

A unidade de análise deixa de ser a carteira de um único advogado e passa a ser a operação do escritório como um todo. A governança de dados deixa de ser uma boa prática de backend e torna-se uma funcionalidade explícita e visível para o usuário.

### Infraestrutura necessária

Modelo de dados multi-tenant com isolamento por escritório. Pipeline de ETL mais robusto para consolidação de múltiplas OABs. Motor de alertas com lógica de threshold configurável. Sistema de autenticação com RBAC (controle de acesso baseado em papéis).

---

## Tier 4 — Diagnóstico Estratégico

**Público-alvo:** Escritório de grande porte, departamento jurídico corporativo (in-house) ou consultoria especializada em due diligence e auditoria de passivos.

**Proposta de valor:** Inteligência jurídica como ativo estratégico. A carteira processual deixa de ser um conjunto de casos a monitorar e passa a ser uma fonte de dados para análise de risco, planejamento estratégico e prestação de contas a conselhos e diretorias.

### Funcionalidades adicionais ao Tier 3

A análise de concentração por tema, classe processual e assunto normalizado permite identificar especializações, dependências de determinados tribunais e exposição a determinados tipos de risco. A identificação de contrapartes recorrentes — com mascaramento de dados pessoais por padrão, em conformidade com a LGPD — oferece uma visão de relacionamento processual que vai além do processo individual.

O módulo de custo de API exibe o consumo de créditos por carteira, por tribunal e por tipo de operação, com projeção de consumo futuro baseada no ritmo atual. Essa funcionalidade é relevante tanto para controle orçamentário quanto para otimização de estratégia de amostragem e atualização.

A integração via webhook ou API própria permite alimentar sistemas externos — ERPs jurídicos, plataformas de BI corporativo, ferramentas de GRC — com os dados processados e agregados pelo painel. Relatórios executivos automatizados com KPIs selecionáveis completam o tier, viabilizando a prestação de contas periódica a diretorias ou conselhos de administração sem intervenção manual.

### Diferença essencial em relação ao Tier 3

O produto passa a funcionar como plataforma, não apenas como ferramenta. A capacidade de integração com sistemas externos e de geração de relatórios executivos automatizados posiciona o produto como infraestrutura de inteligência jurídica, e não como mais um dashboard.

### Infraestrutura necessária

Infraestrutura analítica completa: ETL com cobertura integral das carteiras, cubos de dados para consultas agregadas de alta performance, jobs de atualização em escala com priorização por criticidade. Camada de API própria para integração com sistemas externos. Motor de relatórios com templates configuráveis.

---

## Resumo Comparativo

| Dimensão | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Unidade de análise | Processo individual | Carteira de um advogado | Operação do escritório | Organização / ativo estratégico |
| OABs suportadas | 1 | 1 | Múltiplas | Múltiplas + integração externa |
| Foco principal | Status | Priorização | Governança | Inteligência estratégica |
| Alertas | Fixos | Fixos | Configuráveis | Configuráveis + webhooks |
| Controle de acesso | Não | Não | RBAC básico | RBAC avançado + auditoria |
| Exportação | PDF / CSV | PDF / CSV | Relatórios estruturados | API + relatórios executivos |
| Infraestrutura backend | Mínima | Leve | Intermediária | Completa |
| Complexidade de MVP | Baixa | Média | Alta | Muito alta |

---

## Recomendação de Entrada para MVP

O segmento mais adequado para validação rápida é o **Tier 2 — Carteira Inteligente**.

O advogado autônomo de baixo volume (Tier 1) tende a ter menor disposição a pagar e menor senso de urgência para uma ferramenta analítica. O gestor de escritório (Tier 3) representa um ciclo de venda mais longo e uma infraestrutura de produto mais complexa do que o necessário para uma primeira validação.

O Tier 2 resolve uma dor concreta e bem articulada — "tenho muitos processos e não consigo saber onde estão os problemas" — para um perfil com capacidade de pagamento e com incentivo financeiro direto para resolver o problema. Tecnicamente, é viável com os endpoints documentados da API Escavador v2 sem exigir a camada de multi-OAB e controle de acesso do Tier 3.

A sequência recomendada de validação e evolução é a seguinte:

**Fase 1 (MVP):** Lançar o Tier 2 com um grupo controlado de 10 a 20 advogados de volume médio. Validar a percepção de valor dos indicadores de priorização — especialmente a categorização quente/fria e o histograma de staleness.

**Fase 2 (Expansão):** Com base no feedback, identificar quais funcionalidades do Tier 3 são percebidas como mais urgentes pelos usuários atuais. Priorizar o desenvolvimento da próxima camada com base em evidência real de uso.

**Fase 3 (Escala):** Desenvolver o Tier 3 completo e iniciar prospecção ativa junto a escritórios de médio porte, usando os casos de uso documentados na Fase 2 como prova de conceito.

O Tier 1 pode ser lançado como uma versão freemium ou período de trial do Tier 2 — funcionando como mecanismo de aquisição, não como produto autônomo. O Tier 4 permanece como horizonte estratégico de longo prazo, adequado para quando o produto tiver tração e infraestrutura consolidadas.

---

*Documento gerado com base em pesquisa de mercado e análise da API Escavador v2. Abril de 2026.*
