import { memo, useCallback, useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { flowExecutionService, type FlowData } from "~/services/flowExecutionService";
import { cn } from "~@/utils/cn";

interface SavedFlow extends FlowData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedFlowsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedFlowsModal = memo(({ isOpen, onClose }: SavedFlowsModalProps) => {
  const [flows, setFlows] = useState<SavedFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const { setNodes, setEdges } = useReactFlow();

  const loadFlows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const savedFlows = await flowExecutionService.getSavedFlows();
      setFlows(savedFlows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved flows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFlows();
    }
  }, [isOpen, loadFlows]);

  const importFlow = useCallback(async (flow: SavedFlow) => {
    try {
      setImporting(flow.id);
      const flowData = await flowExecutionService.getFlowById(flow.id);
      
      // Add animation classes to nodes before setting them
      const nodesWithAnimation = flowData.nodes.map(node => ({
        ...node,
        className: 'animate-fadeInScale'
      }));
      
      setNodes(nodesWithAnimation);
      setEdges(flowData.edges);
      
      // Close modal after successful import
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import flow');
    } finally {
      setImporting(null);
    }
  }, [setNodes, setEdges, onClose]);

  const deleteFlow = useCallback(async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) {
      return;
    }

    try {
      await flowExecutionService.deleteFlow(flowId);
      await loadFlows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flow');
    }
  }, [loadFlows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-[800px] max-h-[80vh] border border-dark-200 rounded-xl bg-dark-300/90 shadow-lg animate-fadeInScale"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative overflow-clip rounded-t-xl bg-dark-300">
          <div className="absolute inset-0"></div>
          <div className="absolute h-full w-3/5 from-blue-600/20 to-transparent bg-gradient-to-r" />

          <div className="relative h-11 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
            <div className="flex grow items-center pl-2">
              <div className="size-7 flex items-center justify-center">
                <div className="i-mdi:flow text-blue-400 size-5" />
              </div>

              <div className="ml-1 text-sm font-medium leading-none tracking-wide">
                Saved Flows
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-x-2 pr-2">
              <button
                onClick={loadFlows}
                className="size-7 flex items-center justify-center text-light-900/50 hover:text-light-900/70"
                title="Refresh flows"
              >
                <div className={cn(
                  "i-mdi:refresh size-4",
                  loading && "animate-spin"
                )} />
              </button>
              <button
                type="button"
                className="size-8 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-blue-400 outline-none transition-all duration-200 active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100 rotate-12)"
                onClick={onClose}
              >
                <div className="i-mdi:close size-5" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-dark-200 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-2.75rem)]">
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center py-8 text-light-900/50">
                <div className="i-mdi:loading animate-spin size-5 mr-2" />
                Loading flows...
              </div>
            ) : flows.length === 0 ? (
              <div className="col-span-2 text-sm text-light-900/50 text-center py-8">
                No saved flows yet
              </div>
            ) : (
              flows.map(flow => (
                <div
                  key={flow.id}
                  className={cn(
                    "group flex flex-col gap-3 p-4 rounded-lg border border-dark-200 bg-dark-400/50",
                    "hover:(border-blue-500/30 bg-dark-400) transition-all duration-200",
                    "animate-fadeInScale cursor-pointer",
                    importing === flow.id && "border-blue-500 animate-pulse"
                  )}
                  onClick={() => importFlow(flow)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium group-hover:text-blue-400 transition-colors">
                        {flow.name || 'Untitled Flow'}
                      </h3>
                      {flow.description && (
                        <p className="text-xs text-light-900/50 mt-0.5 line-clamp-2">{flow.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFlow(flow.id); }}
                        className="size-7 flex items-center justify-center text-red-400 hover:bg-dark-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete flow"
                      >
                        <div className="i-mdi:delete-outline size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-light-900/50">
                    <div className="flex items-center gap-1">
                      <div className="i-mdi:chart-bubble size-4" />
                      {flow.nodes?.length || 0} nodes
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="i-mdi:connection size-4" />
                      {flow.edges?.length || 0} connections
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-light-900/50 pt-2 border-t border-dark-200">
                    <div>Created {new Date(flow.createdAt).toLocaleDateString()}</div>
                    <div>Updated {new Date(flow.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});