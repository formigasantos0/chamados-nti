export interface SolicitanteResumo {
  id: number;
  nome: string;
  email: string;
}

export interface UnidadeChamadoResumo {
  id: number;
  nome: string;
  sigla: string;
}

export interface Chamado {
  id: number;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: {
  id: number;
  nome: string;
 };

categoria_id: number;

  prioridade: string;
  status: string;
  solicitante_id: number;
  unidade_id: number;
  responsavel_id: number | null;
  responsavel: SolicitanteResumo | null;
  criado_em: string;
  atualizado_em: string;

  solicitante: SolicitanteResumo;
  unidade: UnidadeChamadoResumo;
}

export interface ChamadoCriar {
  titulo: string;
  descricao: string;
  categoria_id: number;
  prioridade: "baixa" | "normal" | "alta" | "urgente";
}

export interface UsuarioHistoricoResumo {
  id: number;
  nome: string;
  perfil: string;
}

export interface HistoricoChamado {
  id: number;
  tipo: string;
  descricao: string;
  usuario_id: number;
  criado_em: string;
  usuario: UsuarioHistoricoResumo;
}