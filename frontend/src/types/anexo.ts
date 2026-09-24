export interface Anexo {
  id: number;
  chamado_id: number;
  usuario_id: number;
  nome_original: string;
  content_type: string;
  tamanho_bytes: number;
  criado_em: string;
}

export interface AnexoDownload {
  url: string;
  expira_em_segundos: number;
}