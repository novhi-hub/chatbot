export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  modelId: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ModelDetails {
  license: string;
  modelfile: string;
  parameters: string;
  template: string;
  system: string;
}