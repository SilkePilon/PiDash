import type { Edge, Node } from "@xyflow/react";

export interface ExecutionResult {
  success: boolean;
  flowId?: string;
  executionStatus: 'pending' | 'running' | 'success' | 'error';
  message: string;
  nodeResults?: Record<string, any>;
  error?: string;
}

export interface FlowData {
  id?: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt?: string;
  updatedAt?: string;
}

class FlowExecutionService {
  private token: string | null = null;
  
  constructor() {
    // Initialize with token from localStorage if available
    this.token = localStorage.getItem('token');
  }
  
  private getAuthHeaders() {
    if (!this.token) {
      this.token = localStorage.getItem('token');
      if (!this.token) {
        throw new Error('Authentication required');
      }
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }
  
  /**
   * Save a flow to the backend
   */
  async saveFlow(flow: FlowData): Promise<{ id: string }> {
    try {
      const response = await fetch('/api/flows', {
        method: flow.id ? 'PUT' : 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(flow)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save flow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving flow:', error);
      throw error;
    }
  }
  
  /**
   * Execute a flow by ID
   */
  async executeFlow(flowId: string): Promise<ExecutionResult> {
    try {
      const response = await fetch(`/api/flows/${flowId}/execute`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute flow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing flow:', error);
      throw error;
    }
  }
  
  /**
   * Execute a flow directly without saving first
   */
  async executeFlowDirectly(flow: FlowData): Promise<ExecutionResult> {
    try {
      const response = await fetch('/api/flows/execute-direct', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(flow)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute flow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing flow directly:', error);
      return {
        success: false,
        executionStatus: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get the status of a GPIO pin or other device
   */
  async checkDeviceStatus(deviceType: string, deviceId: string): Promise<any> {
    try {
      const response = await fetch(`/api/devices/${deviceType}/${deviceId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check device status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking device status:', error);
      throw error;
    }
  }
  
  /**
   * Set the state of a GPIO pin
   */
  async setGPIOState(piId: string, pin: number, state: boolean | number): Promise<any> {
    try {
      const response = await fetch(`/api/devices/raspberry-pi/${piId}/gpio/${pin}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ state })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set GPIO state');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error setting GPIO state:', error);
      throw error;
    }
  }
  
  /**
   * Get available Raspberry Pi devices
   */
  async getRaspberryPis(): Promise<any[]> {
    try {
      const response = await fetch('/api/raspberry-pis', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get Raspberry Pi devices');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting Raspberry Pi devices:', error);
      return [];
    }
  }

  /**
   * Get all saved flows
   */
  async getSavedFlows(): Promise<FlowData[]> {
    try {
      const response = await fetch('/api/flows', {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved flows');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting saved flows:', error);
      throw error;
    }
  }

  /**
   * Get a flow by ID
   */
  async getFlowById(id: string): Promise<FlowData> {
    try {
      const response = await fetch(`/api/flows/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch flow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting flow:', error);
      throw error;
    }
  }

  /**
   * Delete a flow by ID
   */
  async deleteFlow(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/flows/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete flow');
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
      throw error;
    }
  }
}

export const flowExecutionService = new FlowExecutionService();