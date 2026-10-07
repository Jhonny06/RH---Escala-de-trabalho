"""
Escala API — guarda a escala das lojas (antes só no navegador de cada
computador) para o coordenador de DP editar e os gerentes consultarem,
e recebe as solicitações de alteração dos gerentes.

Rotas (todas em /api/escala):
    GET   /health
    GET   /global                 horários, tarefas, planejamento (orçado) e base de lojas
    PUT   /global                 [DP]   {dados, versao}
    GET   /lojas/{loja}           equipe, escalas, tarefas e extras da loja (01..99)
    PUT   /lojas/{loja}           [DP]   {dados, versao}
    GET   /lojas/{loja}/tarefas   tarefas cadastradas e tarefas do mês da loja
    PUT   /lojas/{loja}/tarefas   gerente ou DP  {dados, versao}
    GET   /solicitacoes?loja=&status=
    POST  /solicitacoes           gerente cria um pedido de alteração
    PATCH /solicitacoes/{id}      [DP]   {status, resposta}

[DP] = exige Authorization: Bearer <ESCALA_API_TOKEN>.

Rodar localmente:
    uvicorn app.main:app --reload --port 8080
"""
import json
import re
from typing import Any, Literal

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import db
from .auth import require_dp, usuario

# lojas 01 a 99: a lista real vem da base de lojas (documento "global")
LOJA_RE = re.compile(r"^(0[1-9]|[1-9][0-9])$")
MES_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
MAX_DOC_BYTES = 5 * 1024 * 1024

db.init_db()

app = FastAPI(title="Escala API")

# Em produção a página e a API ficam no mesmo endereço (Apache faz o
# proxy), então CORS não é necessário; fica liberado só para testar a
# página aberta direto do disco/localhost apontando para a API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "PUT", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Usuario"],
)


class Doc(BaseModel):
    dados: dict[str, Any]
    versao: int = Field(ge=0)


class GlobalDados(BaseModel):
    presets: list = []
    tarefas: list = []
    planos: dict = {}
    base: list = []      # base de lojas (supervisor, local, funcionamento, filiais)


class LojaDados(BaseModel):
    loja: str = ""
    gerente: str = ""
    employees: list = []
    months: dict = {}
    tmonths: dict = {}


class TarefasDados(BaseModel):
    tarefas: list = []
    tmonths: dict = {}


TIPOS_SOL = ("troca_turno", "troca_folga", "ferias", "atestado", "extra", "outro")


class NovaSolicitacao(BaseModel):
    loja: str
    mes: str
    solicitante: str = Field(min_length=2, max_length=80)
    colaborador: str | None = Field(default=None, max_length=120)
    dias: str | None = Field(default=None, max_length=120)
    tipo: Literal[TIPOS_SOL]
    descricao: str = Field(min_length=3, max_length=1000)


class Resposta(BaseModel):
    status: Literal["aprovada", "recusada", "concluida", "pendente"]
    resposta: str | None = Field(default=None, max_length=1000)


def _checa_loja(loja: str):
    if not LOJA_RE.match(loja):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Loja inválida (01 a 99).")


def _grava(chave: str, doc: Doc, modelo, quem: str):
    dados = modelo.model_validate(doc.dados).model_dump()
    if len(json.dumps(dados)) > MAX_DOC_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Dados grandes demais.")
    try:
        nova = db.set_doc(chave, dados, doc.versao, quem)
    except db.ConflitoVersao as c:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            {"msg": "Os dados foram alterados por outra pessoa.", "versao_atual": c.atual},
        )
    return {"versao": nova}


@app.get("/api/escala/health")
def health():
    return {"ok": True}


@app.get("/api/escala/global")
def get_global():
    return db.get_doc("global")


@app.put("/api/escala/global", dependencies=[Depends(require_dp)])
def put_global(doc: Doc, quem: str = Depends(usuario)):
    return _grava("global", doc, GlobalDados, quem)


@app.get("/api/escala/lojas/{loja}")
def get_loja(loja: str):
    _checa_loja(loja)
    return db.get_doc(f"loja:{loja}")


@app.put("/api/escala/lojas/{loja}", dependencies=[Depends(require_dp)])
def put_loja(loja: str, doc: Doc, quem: str = Depends(usuario)):
    _checa_loja(loja)
    return _grava(f"loja:{loja}", doc, LojaDados, quem)


# Tarefas administrativas: o gerente monta as da própria loja, por isso
# a gravação não exige o token do DP (mesmo nível das solicitações).
@app.get("/api/escala/lojas/{loja}/tarefas")
def get_tarefas(loja: str):
    _checa_loja(loja)
    return db.get_doc(f"tarefas:{loja}")


@app.put("/api/escala/lojas/{loja}/tarefas")
def put_tarefas(loja: str, doc: Doc, quem: str = Depends(usuario)):
    _checa_loja(loja)
    return _grava(f"tarefas:{loja}", doc, TarefasDados, quem)


@app.get("/api/escala/solicitacoes")
def get_solicitacoes(loja: str | None = None, situacao: str | None = Query(default=None, alias="status")):
    if loja:
        _checa_loja(loja)
    return db.listar_solicitacoes(loja, situacao)


@app.post("/api/escala/solicitacoes", status_code=201)
def post_solicitacao(s: NovaSolicitacao):
    _checa_loja(s.loja)
    if not MES_RE.match(s.mes):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Mês inválido (AAAA-MM).")
    return db.criar_solicitacao(s.model_dump())


@app.patch("/api/escala/solicitacoes/{id_}", dependencies=[Depends(require_dp)])
def patch_solicitacao(id_: int, r: Resposta, quem: str = Depends(usuario)):
    sol = db.responder_solicitacao(id_, r.status, r.resposta, quem)
    if not sol:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Solicitação não encontrada.")
    return sol
