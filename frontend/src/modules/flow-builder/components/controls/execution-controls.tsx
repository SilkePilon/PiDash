import { useReactFlow } from "@xyflow/react";
import { useState, useCallback } from "react";
import { flowExecutionService, type ExecutionResult } from "~/services/flowExecutionService";
import { cn } from "~@/utils/cn";
import { SaveFlowDialog } from "../dialogs/save-flow-dialog";
import { SavedFlowsModal } from "~/modules/flow-builder/components/modals/saved-flows-modal";

export function ExecutionControls() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showFlowsModal, setShowFlowsModal] = useState(false);
  
  const { getNodes, getEdges, setNodes } = useReactFlow();
  
  const executeFlow = useCallback(async () => {
    try {
      setIsExecuting(true);
      setExecutionResult(null);
      
      // Get current flow state
      const nodes = getNodes();
      const edges = getEdges();
      
      // Highlight the flow being executed
      setNodes(nodes.map(node => ({
        ...node,
        data: { ...node.data, executing: true }
      })));
      
      // Create flow data
      const flowData = {
        name: "Flow Execution",
        nodes,
        edges
      };
      
      // Execute the flow directly without saving
      const result = await flowExecutionService.executeFlowDirectly(flowData);
      
      // Update execution status
      setExecutionResult(result);
      setShowResults(true);
      
      // Update node states based on execution results
      if (result && result.nodeResults) {
        setNodes(nodes.map(node => ({
          ...node,
          data: { 
            ...node.data, 
            executing: false,
            executionStatus: result.nodeResults && result.nodeResults[node.id]?.status || 'none',
            executionResult: result.nodeResults && result.nodeResults[node.id]
          }
        })));
      } else {
        // Reset execution state if no results
        setNodes(nodes.map(node => ({
          ...node,
          data: { ...node.data, executing: false }
        })));
      }
    } catch (error) {
      console.error("Flow execution error:", error);
      setExecutionResult({
        success: false,
        executionStatus: 'error',
        message: error instanceof Error ? error.message : 'Unknown execution error',
        error: error instanceof Error ? error.message : 'Unknown execution error'
      });
      setShowResults(true);
      
      // Reset execution state
      setNodes(getNodes().map(node => ({
        ...node,
        data: { ...node.data, executing: false }
      })));
    } finally {
      setIsExecuting(false);
    }
  }, [getNodes, getEdges, setNodes]);
  
  const handleSaveFlow = useCallback(async ({ name, description }: { name: string; description?: string }) => {
    try {
      setIsExecuting(true);
      
      // Get current flow state
      const nodes = getNodes();
      const edges = getEdges();
      
      // Create flow data
      const flowData = {
        name,
        description,
        nodes,
        edges
      };
      
      // Save the flow
      const result = await flowExecutionService.saveFlow(flowData);
      
      setExecutionResult({
        success: true,
        flowId: result.id,
        executionStatus: 'success',
        message: `Flow "${name}" saved successfully`
      });
      setShowResults(true);
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Flow save error:", error);
      setExecutionResult({
        success: false,
        executionStatus: 'error',
        message: error instanceof Error ? error.message : 'Unknown save error',
        error: error instanceof Error ? error.message : 'Unknown save error'
      });
      setShowResults(true);
    } finally {
      setIsExecuting(false);
    }
  }, [getNodes, getEdges]);
  
  return (
    <>
      <div className="absolute bottom-8 right-5 z-10">
        <div className="flex flex-col gap-2">
          {showResults && executionResult && (
            <div 
              className={cn(
                "py-2 px-3 rounded-lg shadow-lg mb-2 text-sm animate-fadeIn",
                executionResult.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
                "border border-dark-200"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center">
                  {executionResult.success ? (
                    <div className="i-mdi:check-circle mr-1.5 size-4" />
                  ) : (
                    <div className="i-mdi:alert-circle mr-1.5 size-4" />
                  )}
                  <span className="max-w-[300px] truncate">
                    {executionResult.message}
                  </span>
                </div>
                <button 
                  onClick={() => setShowResults(false)}
                  className="text-light-900/50 hover:text-light-900/70"
                >
                  <div className="i-mdi:close size-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowFlowsModal(true)}
              className={cn(
                "px-4 py-2 rounded-lg bg-dark-300/90 border border-dark-200 text-sm font-medium",
                "text-blue-400 hover:bg-dark-400/90 hover:shadow-lg transition-all duration-200 transform",
                "flex items-center gap-2"
              )}
            >
              <div className="i-mdi:flow size-4" />
              Open Flows
            </button>
            
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={isExecuting}
              className={cn(
                "px-4 py-2 rounded-lg bg-dark-300/90 border border-dark-200 text-sm font-medium",
                "text-teal-400 hover:bg-dark-400/90 hover:shadow-lg transition-all duration-200 transform",
                "flex items-center gap-2",
                isExecuting && "opacity-50 cursor-wait"
              )}
            >
              <div className="i-mdi:content-save size-4" />
              Save Flow
            </button>
            
            <button
              onClick={executeFlow}
              disabled={isExecuting}
              className={cn(
                "px-4 py-2 rounded-lg bg-dark-300/90 border border-dark-200 text-sm font-medium",
                "text-red-400 hover:bg-dark-400/90 hover:shadow-lg transition-all duration-200 transform",
                "flex items-center gap-2",
                isExecuting && "opacity-50 cursor-wait"
              )}
            >
              {isExecuting ? (
                <>
                  <div className="i-mdi:loading animate-spin size-4" />
                  Executing...
                </>
              ) : (
                <>
                  <div className="i-mdi:play size-4" />
                  Execute Flow
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <SaveFlowDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveFlow}
        isSaving={isExecuting}
      />

      <SavedFlowsModal
        isOpen={showFlowsModal}
        onClose={() => setShowFlowsModal(false)}
      />
    </>
  );
}