"""
Autenticação das rotas de escrita do DP — mesmo passo intermediário do
novanet-api (token fixo via variável de ambiente) até integrar com o
login do portal. Ver README.md deste projeto.

Gerentes não usam token: só leem a escala e criam solicitações.
"""
import os
from urllib.parse import unquote

from fastapi import Header, HTTPException, status

API_TOKEN = os.environ.get("ESCALA_API_TOKEN", "")


def require_dp(authorization: str = Header(default="")):
    if not API_TOKEN:
        # Falha fechada: sem token configurado no servidor, ninguém grava.
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "ESCALA_API_TOKEN não configurado no servidor.",
        )
    if authorization != "Bearer " + API_TOKEN:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Não autorizado.")


def usuario(x_usuario: str = Header(default="desconhecido")) -> str:
    """Nome de quem fez a mudança, para o audit_log (ainda sem login de
    verdade, então é o nome informado na própria tela)."""
    return unquote(x_usuario)[:80]
