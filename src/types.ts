export interface Alerta {
  id: string;
  estudante_id: string;
  estudante: {
    nome: string;
    matricula: string;
    telefone: string;
  };
  localizacao: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  data_hora: string | number;
  status?: string;
  resolvido?: boolean;
}
