/* Configuração do coordenador de DP — este arquivo NÃO pode ficar
   acessível aos gerentes: no portal, libere-o só para o perfil do DP.

   token:   o mesmo ESCALA_API_TOKEN configurado no servidor (api/.env).
            Vazio = a página abre só para visualização.
   usuario: nome que aparece no histórico de alterações e nas respostas
            às solicitações. */
window.ESCALA_DP = {
  token: '',
  usuario: 'Coordenador de DP'
};
