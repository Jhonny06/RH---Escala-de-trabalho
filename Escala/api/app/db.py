"""
Armazenamento da escala em SQLite — mesmo padrão do novanet-api.

Dois tipos de dado:

- documentos JSON (tabela docs), um por chave:
    "global"     -> horários, tarefas, planejamento (orçado) e base de lojas
    "loja:07"    -> equipe, escalas, tarefas do mês e extras da loja 07
  Cada documento tem um número de versão: quem grava manda a versão que
  leu; se alguém gravou antes, a gravação é recusada (409) em vez de
  apagar o trabalho do outro sem aviso.

- solicitações de alteração feitas pelos gerentes (tabela solicitacoes).

Toda gravação vai também para audit_log (histórico de quem mudou o quê).
"""
import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

DB_PATH = os.environ.get(
    "ESCALA_DB_PATH",
    os.path.join(os.path.dirname(__file__), "..", "escala.db"),
)


def agora() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS docs (
                chave TEXT PRIMARY KEY,
                dados TEXT NOT NULL,
                versao INTEGER NOT NULL,
                atualizado_em TEXT NOT NULL,
                atualizado_por TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS solicitacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                loja TEXT NOT NULL,
                mes TEXT NOT NULL,
                solicitante TEXT NOT NULL,
                colaborador TEXT,
                dias TEXT,
                tipo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pendente',
                resposta TEXT,
                respondido_por TEXT,
                criado_em TEXT NOT NULL,
                atualizado_em TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS ix_sol_loja ON solicitacoes (loja, status)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alvo TEXT NOT NULL,
                acao TEXT NOT NULL,
                usuario TEXT,
                em TEXT NOT NULL,
                dados TEXT
            )
            """
        )


def _log(conn, alvo: str, acao: str, usuario: str | None, dados):
    conn.execute(
        "INSERT INTO audit_log (alvo, acao, usuario, em, dados) VALUES (?, ?, ?, ?, ?)",
        (alvo, acao, usuario, agora(), json.dumps(dados, ensure_ascii=False) if dados is not None else None),
    )


# ---------------- documentos ----------------

def get_doc(chave: str):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT dados, versao, atualizado_em, atualizado_por FROM docs WHERE chave = ?",
            (chave,),
        ).fetchone()
        if not row:
            return {"dados": None, "versao": 0, "atualizado_em": None, "atualizado_por": None}
        return {
            "dados": json.loads(row["dados"]),
            "versao": row["versao"],
            "atualizado_em": row["atualizado_em"],
            "atualizado_por": row["atualizado_por"],
        }


class ConflitoVersao(Exception):
    def __init__(self, atual: int):
        self.atual = atual


def set_doc(chave: str, dados, versao_lida: int, usuario: str | None) -> int:
    """Grava se a versão lida ainda for a atual; devolve a nova versão."""
    payload = json.dumps(dados, ensure_ascii=False)
    with get_conn() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT versao FROM docs WHERE chave = ?", (chave,)).fetchone()
        atual = row["versao"] if row else 0
        if versao_lida != atual:
            raise ConflitoVersao(atual)
        nova = atual + 1
        conn.execute(
            """
            INSERT INTO docs (chave, dados, versao, atualizado_em, atualizado_por)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(chave) DO UPDATE SET
                dados = excluded.dados, versao = excluded.versao,
                atualizado_em = excluded.atualizado_em, atualizado_por = excluded.atualizado_por
            """,
            (chave, payload, nova, agora(), usuario),
        )
        _log(conn, chave, "set", usuario, dados)
        return nova


# ---------------- solicitações ----------------

def _sol(row) -> dict:
    return dict(row)


def listar_solicitacoes(loja: str | None, status: str | None) -> list:
    sql, args = "SELECT * FROM solicitacoes WHERE 1=1", []
    if loja:
        sql += " AND loja = ?"
        args.append(loja)
    if status:
        sql += " AND status = ?"
        args.append(status)
    sql += " ORDER BY CASE status WHEN 'pendente' THEN 0 ELSE 1 END, id DESC LIMIT 500"
    with get_conn() as conn:
        return [_sol(r) for r in conn.execute(sql, args).fetchall()]


def criar_solicitacao(s: dict) -> dict:
    now = agora()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO solicitacoes
                (loja, mes, solicitante, colaborador, dias, tipo, descricao, status, criado_em, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?)
            """,
            (s["loja"], s["mes"], s["solicitante"], s.get("colaborador"), s.get("dias"),
             s["tipo"], s["descricao"], now, now),
        )
        _log(conn, f"solicitacao:{cur.lastrowid}", "criar", s["solicitante"], s)
        return _sol(conn.execute("SELECT * FROM solicitacoes WHERE id = ?", (cur.lastrowid,)).fetchone())


def responder_solicitacao(id_: int, status: str, resposta: str | None, usuario: str | None):
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM solicitacoes WHERE id = ?", (id_,)).fetchone()
        if not row:
            return None
        conn.execute(
            "UPDATE solicitacoes SET status = ?, resposta = ?, respondido_por = ?, atualizado_em = ? WHERE id = ?",
            (status, resposta, usuario, agora(), id_),
        )
        _log(conn, f"solicitacao:{id_}", status, usuario, {"resposta": resposta})
        return _sol(conn.execute("SELECT * FROM solicitacoes WHERE id = ?", (id_,)).fetchone())
