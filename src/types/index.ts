// Workflow types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  workflowId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
