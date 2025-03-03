import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { isEmpty } from "radash";
import { memo, useCallback, useMemo, useState, useEffect } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { GitHubOperationSelector } from "~/modules/nodes/nodes/github-node/components/github-operation-selector";
import { type GitHubOperationDetail, type GitHubOperationType, getGitHubOperationDetails } from "~/modules/nodes/nodes/github-node/constants/operations";
import { type BaseNodeData, BuilderNode, NodeCategory, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";
import GitHubNodePropertyPanel from "~/modules/sidebar/panels/node-properties/property-panels/github-property-panel";
import { useApplicationState } from "~/stores/application-state";

import { cn } from "~@/utils/cn";

const NODE_TYPE = BuilderNode.GITHUB;

export interface GitHubNodeData extends BaseNodeData {
    operation: GitHubOperationType;
    apiKey: string;
    repository: string;
    branch: string;
    status: "idle" | "running" | "success" | "error";
    output: string;
    errorMessage?: string;
    eventTrigger?: string;
    commitMessage?: string;
    filePath?: string;
}

type GitHubNodeProps = NodeProps<Node<GitHubNodeData, typeof NODE_TYPE>>;

export function GitHubNode({ id, isConnectable, selected, data }: GitHubNodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);

    const [showNodePropertiesOf] = useApplicationState(s => [s.actions.sidebar.showNodePropertiesOf]);
    const [sourceHandleId] = useState<string>(nanoid());
    const [showSuccess, setShowSuccess] = useState(false);

    const { setNodes } = useReactFlow();
    const deleteNode = useDeleteNode();

    const operationDetail = useMemo(() => {
        return getGitHubOperationDetails(data.operation);
    }, [data.operation]);

    // Clear success notification after delay
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const onOperationSelect = useCallback(
        (operation: GitHubOperationDetail & { type: GitHubOperationType }) => {
            setNodes(nodes => produce(nodes, (draft) => {
                const node = draft.find(node => node.id === id);

                if (node)
                    node.data.operation = operation.type;
            }));
        },
        [id, setNodes],
    );

    const showNodeProperties = useCallback(() => {
        showNodePropertiesOf({ 
            id, 
            type: NODE_TYPE,
        });
    }, [id, showNodePropertiesOf]);

    const executeOperation = useCallback(() => {
        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as GitHubNodeData;
                    nodeData.status = "running";
                    nodeData.output = "";
                    nodeData.errorMessage = undefined;

                    // Simulate operation execution - in real implementation, this would connect to GitHub API
                    setTimeout(() => {
                        setNodes((nodes) =>
                            produce(nodes, (draft) => {
                                const node = draft.find((n) => n.id === id);
                                if (node) {
                                    const nodeData = node.data as GitHubNodeData;
                                    
                                    if (isEmpty(nodeData.apiKey)) {
                                        nodeData.status = "error";
                                        nodeData.errorMessage = "GitHub API key required";
                                        return;
                                    }
                                    
                                    if (isEmpty(nodeData.repository)) {
                                        nodeData.status = "error";
                                        nodeData.errorMessage = "Repository name required";
                                        return;
                                    }

                                    nodeData.status = "success";
                                    
                                    // Generate appropriate simulated output based on operation
                                    switch (nodeData.operation) {
                                        case "pull":
                                            nodeData.output = `Pulled latest changes from ${nodeData.repository}${nodeData.branch ? ` branch ${nodeData.branch}` : ''}.\nUpdated 3 files, 24 insertions(+), 12 deletions(-)`;
                                            break;
                                        case "push":
                                            nodeData.output = `Pushed changes to ${nodeData.repository}${nodeData.branch ? ` branch ${nodeData.branch}` : ''}.\n2 commits pushed to origin.`;
                                            break;
                                        case "commit":
                                            nodeData.output = `Changes committed to ${nodeData.repository}.\nCommit hash: ${nanoid(7)}\nCommit message: ${nodeData.commitMessage || 'Update files'}`;
                                            break;
                                        case "webhook":
                                            nodeData.output = `Webhook listener configured for ${nodeData.eventTrigger || 'push'} events on ${nodeData.repository}.`;
                                            break;
                                        case "status":
                                            nodeData.output = `Repository: ${nodeData.repository}\nBranch: ${nodeData.branch || 'main'}\nLast commit: ${new Date().toISOString()}\nStatus: 3 files ahead of origin`;
                                            break;
                                        default:
                                            nodeData.output = `GitHub operation completed successfully at ${new Date().toLocaleTimeString()}`;
                                    }
                                    
                                    setShowSuccess(true);
                                }
                            }),
                        );
                    }, 1500);
                }
            }),
        );
    }, [id, setNodes]);

    return (
        <>
            <div
                data-selected={selected}
                className="w-xs overflow-clip border border-dark-200 rounded-xl bg-dark-300/50 shadow-sm transition divide-y divide-dark-200 data-[selected=true]:(border-purple-600 ring-1 ring-purple-600/50)"
                onDoubleClick={showNodeProperties}
            >
                <div className="relative bg-dark-300/50">
                    <div className="absolute inset-0">
                        <div className="absolute h-full w-3/5 from-purple-900/20 to-transparent bg-gradient-to-r" />
                    </div>

                    <div className="relative h-9 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
                        <div className="flex grow items-center pl-0.5">
                            <div className="size-7 flex items-center justify-center">
                                <div className="size-6 flex items-center justify-center rounded-lg">
                                    <div className={cn(meta.icon, "size-4")} />
                                </div>
                            </div>

                            <div className="ml-1 text-xs font-medium leading-none tracking-wide uppercase op-80">
                                <span className="translate-y-px">
                                    {meta.title}
                                </span>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
                            <GitHubOperationSelector detail={operationDetail} onSelect={onOperationSelect} />

                            <div className="mx-1 h-4 w-px bg-dark-100" />

                            <button
                                type="button"
                                className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent outline-none transition active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
                                onClick={() => showNodeProperties()}
                            >
                                <div className="i-mynaui:cog size-4" />
                            </button>

                            <button
                                type="button"
                                className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none transition active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100)"
                                onClick={() => deleteNode(id)}
                            >
                                <div className="i-mynaui:trash size-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col divide-y divide-dark-200">
                    <div className="flex flex-col p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-light-900/50 font-medium">
                                {operationDetail.name} Operation
                            </div>
                            <button
                                type="button"
                                disabled={data.status === "running"}
                                className={cn(
                                    "px-3 py-1 text-xs rounded-full font-medium",
                                    data.status === "running" ? "bg-blue-500/20 text-blue-300 animate-pulse" : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 active:bg-purple-500/40"
                                )}
                                onClick={executeOperation}
                            >
                                {data.status === "running" ? "Running..." : "Run Now"}
                            </button>
                        </div>

                        <div className="mt-2 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-sm">
                                <div>Repository:</div>
                                <div className="text-light-900/80 font-mono">
                                    {data.repository || <span className="italic text-light-900/50">Not set</span>}
                                </div>
                            </div>
                            {data.branch && (
                                <div className="flex justify-between items-center text-sm">
                                    <div>Branch:</div>
                                    <div className="text-light-900/80 font-mono">{data.branch}</div>
                                </div>
                            )}
                            {data.operation === "commit" && data.commitMessage && (
                                <div className="flex justify-between items-center text-sm">
                                    <div>Commit Message:</div>
                                    <div className="text-light-900/80 line-clamp-1 max-w-[200px]">{data.commitMessage}</div>
                                </div>
                            )}
                            {data.operation === "webhook" && data.eventTrigger && (
                                <div className="flex justify-between items-center text-sm">
                                    <div>Event Trigger:</div>
                                    <div className="text-light-900/80 font-mono">{data.eventTrigger}</div>
                                </div>
                            )}
                        </div>

                        {showSuccess && (
                            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 animate-pulse">
                                Operation completed successfully!
                            </div>
                        )}

                        {!isEmpty(data.output) && (
                            <div className="mt-3 p-2 bg-dark-400/50 border border-dark-300 rounded-md font-mono text-xs text-light-900/70 overflow-auto max-h-32">
                                {data.output.split("\n").map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </div>
                        )}

                        {data.errorMessage && (
                            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 animate-pulse">
                                {data.errorMessage}
                            </div>
                        )}
                    </div>

                    <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
                        Node: <span className="text-light-900/60 font-semibold">#{id}</span>
                    </div>
                </div>
            </div>

            <CustomHandle
                type="target"
                id={sourceHandleId}
                position={Position.Left}
                isConnectable={isConnectable}
            />

            <CustomHandle
                type="source"
                id={sourceHandleId}
                position={Position.Right}
                isConnectable={isConnectable}
            />
        </>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<GitHubNodeData> = {
    type: NODE_TYPE,
    node: memo(GitHubNode),
    detail: {
        icon: "i-uil:github",
        title: "GitHub",
        description: "Interact with GitHub repositories, perform Git operations, and respond to GitHub events.",
        category: NodeCategory.INTEGRATIONS
    },
    defaultData: {
        operation: "pull",
        apiKey: "",
        repository: "",
        branch: "main",
        status: "idle",
        output: "",
    },
    propertyPanel: GitHubNodePropertyPanel,
};