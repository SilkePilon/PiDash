import { useReactFlow } from "@xyflow/react";
import { memo, useEffect, useState } from "react";
import { useApplicationState } from "~/stores/application-state";
import { cn } from "~@/utils/cn";
import { ExecutionStatus } from "~/modules/nodes/types";

export interface ExecutionExplorerPanelProps {
  className?: string;
}

export const ExecutionExplorerPanel = memo(({ className }: ExecutionExplorerPanelProps) => {
  const [selectedNode] = useApplicationState(s => [s.sidebar.panels.nodeProperties.selectedNode]);
  const { getNode } = useReactFlow();
  const [node, setNode] = useState<any>(null);
  
  // Update node data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      const currentNode = getNode(selectedNode.id);
      setNode(currentNode);
    } else {
      setNode(null);
    }
  }, [selectedNode, getNode]);
  
  // If no node is selected or node has no execution data
  if (!node || (!node.data.executionStatus && !node.data.executing)) {
    return null;
  }
  
  // Get execution information
  const { executing, executionStatus, executionResult } = node.data;
  const hasResult = !!executionResult;
  
  // Status colors
  const statusColors = {
    [ExecutionStatus.RUNNING]: "text-yellow-400",
    [ExecutionStatus.SUCCESS]: "text-green-400",
    [ExecutionStatus.ERROR]: "text-red-400",
    [ExecutionStatus.PENDING]: "text-blue-400",
    [ExecutionStatus.SKIPPED]: "text-gray-400",
    [ExecutionStatus.NONE]: "text-light-900/50"
  };
  
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center">
          <div className="i-mdi:chart-timeline size-5 mr-2 text-red-400" />
          Execution Details
        </h3>
        
        <div className="flex items-center">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            executing ? "bg-yellow-500/10 text-yellow-400" : 
            statusColors[executionStatus || ExecutionStatus.NONE],
            executing ? "bg-yellow-500/10" :
            executionStatus === ExecutionStatus.SUCCESS ? "bg-green-500/10" :
            executionStatus === ExecutionStatus.ERROR ? "bg-red-500/10" :
            executionStatus === ExecutionStatus.PENDING ? "bg-blue-500/10" :
            executionStatus === ExecutionStatus.SKIPPED ? "bg-gray-500/10" :
            "bg-light-900/5"
          )}>
            {executing ? "Running" : executionStatus || "No Status"}
          </span>
        </div>
      </div>
      
      {hasResult && (
        <div className="space-y-3">
          {/* Show execution message if available */}
          {executionResult.message && (
            <div className={cn(
              "px-3 py-2 rounded-md text-sm",
              executionStatus === ExecutionStatus.SUCCESS ? "bg-green-500/10 text-green-400" : 
              executionStatus === ExecutionStatus.ERROR ? "bg-red-500/10 text-red-400" :
              "bg-light-900/5 text-light-900/70"
            )}>
              {executionResult.message}
            </div>
          )}
          
          {/* Show stdout if available */}
          {executionResult.stdout && (
            <div>
              <div className="text-xs text-light-900/50 mb-1 flex items-center">
                <div className="i-mdi:console size-4 mr-1" /> Standard Output
              </div>
              <pre className="bg-dark-500 text-green-300 p-2 rounded-md text-sm overflow-auto max-h-40">
                {executionResult.stdout}
              </pre>
            </div>
          )}
          
          {/* Show stderr if available */}
          {executionResult.stderr && (
            <div>
              <div className="text-xs text-light-900/50 mb-1 flex items-center">
                <div className="i-mdi:alert-circle size-4 mr-1" /> Error Output
              </div>
              <pre className="bg-dark-500 text-red-300 p-2 rounded-md text-sm overflow-auto max-h-40">
                {executionResult.stderr}
              </pre>
            </div>
          )}
          
          {/* Show error if available */}
          {executionResult.error && (
            <div>
              <div className="text-xs text-light-900/50 mb-1 flex items-center">
                <div className="i-mdi:alert-octagon size-4 mr-1" /> Error
              </div>
              <div className="bg-dark-500 text-red-400 p-2 rounded-md text-sm">
                {executionResult.error}
              </div>
            </div>
          )}
          
          {/* For command nodes, show the command that was executed */}
          {executionResult.command && (
            <div>
              <div className="text-xs text-light-900/50 mb-1 flex items-center">
                <div className="i-mdi:console-line size-4 mr-1" /> Command
              </div>
              <div className="bg-dark-500 text-blue-300 p-2 rounded-md text-sm font-mono">
                {executionResult.command}
              </div>
            </div>
          )}
          
          {/* For GPIO nodes, show pin information */}
          {executionResult.pin !== undefined && (
            <div>
              <div className="text-xs text-light-900/50 mb-1 flex items-center">
                <div className="i-mdi:led size-4 mr-1" /> GPIO Pin
              </div>
              <div className="bg-dark-500 p-2 rounded-md text-sm">
                Pin {executionResult.pin} set to {executionResult.state === true ? "HIGH" : executionResult.state === false ? "LOW" : executionResult.state}
              </div>
            </div>
          )}
          
          {/* Show execution time if available */}
          {executionResult.executionTime && (
            <div className="text-xs text-light-900/70">
              Execution time: {executionResult.executionTime}ms
            </div>
          )}
        </div>
      )}
      
      {/* Show executing animation when node is running */}
      {executing && (
        <div className="flex justify-center items-center py-4">
          <div className="i-mdi:loading animate-spin size-6 text-yellow-400" />
          <span className="ml-2 text-yellow-400">Executing...</span>
        </div>
      )}
      
      {/* If no result available yet */}
      {!hasResult && !executing && (
        <div className="text-sm text-light-900/50 italic">
          No execution results available for this node.
        </div>
      )}
    </div>
  );
});