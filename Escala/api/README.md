# escala-api

Backend da **Escala de Trabalho das lojas**. Guarda no servidor o que antes
ficava só no navegador de cada computador, para:

- o **coordenador de DP** montar e editar a escala (página `index.html`);
- o **gerente da loja** consultar a escala sem editar, montar as **tarefas**
  da loja e **solicitar alterações** ao DP (página `gerente.html?loja=07`).

FastAPI + SQLite em Docker, mesmo padrão do `novanet-api`.

## O que fica guardado

| Documento            | Conteúdo                                         | Quem grava      |
|----------------------|--------------------------------------------------|-----------------|
| `global`             | horários (turnos), planejamento/orçado e base de lojas | DP (token) |
| `loja:07`            | equipe, escala do mês, extras, envio/aprovação   | DP (token)      |
| `tarefas:07`         | tarefas cadastradas e tarefas do mês da loja     | gerente ou DP   |
| tabela `solicitacoes`| pedidos de alteração dos gerentes                | gerente cria, DP responde (token) |

Cada documento tem **versão**: se duas pessoas editam ao mesmo tempo, a
segunda gravação é recusada (409) e a tela avisa e recarrega, em vez de
apagar o trabalho da outra. Toda gravação vai para `audit_log`.

## Rotas (`/api/escala`)

```
GET   /health
GET   /global                     PUT /global                 [DP]
GET   /lojas/{01..99}             PUT /lojas/{loja}           [DP]
GET   /lojas/{loja}/tarefas       PUT /lojas/{loja}/tarefas
GET   /solicitacoes?loja=&status= POST /solicitacoes
PATCH /solicitacoes/{id}          [DP]  {status: concluida|recusada|aprovada|pendente, resposta}
```

`[DP]` exige `Authorization: Bearer <ESCALA_API_TOKEN>`.
PUT recebe `{"dados": {...}, "versao": <versão lida>}`.

## Rodar localmente

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set ESCALA_API_TOKEN=um-token-qualquer-pra-testar
uvicorn app.main:app --reload --port 8080
```

## Deploy (Docker, no host de apps — 172.20.0.9)

```bash
cp .env.example .env      # coloque um ESCALA_API_TOKEN forte
docker compose up -d --build
```

Publica só em `127.0.0.1:8092` nesse host; `data/escala.db` fica em volume
(sobrevive a rebuild).

### Apache — proxy reverso

No `<VirtualHost>` onde a página da escala for hospedada:

```apache
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass /api/escala/ http://172.20.0.9:8092/api/escala/
  ProxyPassReverse /api/escala/ http://172.20.0.9:8092/api/escala/
</IfModule>
```

## Página (pasta da escala)

- `config.js` — endereço da API (padrão `/api/escala`).
- `config-dp.js` — **token do DP** (o mesmo do `.env`) e o nome do usuário.
  **No portal, libere este arquivo e o `index.html` só para o perfil do DP.**
  Sem o token, a página abre automaticamente só para visualização.
- `gerente.html?loja=07` — entrada do gerente (o portal deve passar o número
  da loja; com ele, o gerente não consegue trocar de loja).

Na primeira vez que o DP abrir a página conectada ao servidor, a escala que
estava salva no navegador dele sobe para a loja selecionada.

## Segurança — passo intermediário

Igual ao `novanet-api`: o token do DP é fixo e fica num arquivo da página, e
as rotas do gerente (ler, tarefas, solicitações) não exigem login. Isso vale
enquanto o acesso é controlado pelo portal. O próximo passo é usar o login do
portal/AD na própria API (quem é DP, quem é gerente de qual loja).
