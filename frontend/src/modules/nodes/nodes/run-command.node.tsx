import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState, useEffect } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { type BaseNodeData, BuilderNode, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";

import { cn } from "~@/utils/cn";

const NODE_TYPE = BuilderNode.RUN_COMMAND;

export interface RunCommandNodeData extends BaseNodeData {
    command: string;
    output: string;
    status: "idle" | "running" | "success" | "error";
    errorMessage?: string;
}

type RunCommandNodeProps = NodeProps<Node<RunCommandNodeData, typeof NODE_TYPE>>;

export function RunCommandNode({ id, isConnectable, selected, data }: RunCommandNodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);

    const [sourceHandleId] = useState<string>(nanoid());
    const [targetHandleId] = useState<string>(nanoid());
    const [showSuccess, setShowSuccess] = useState(false);

    const { setNodes } = useReactFlow();
    const deleteNode = useDeleteNode();

    // Clear success notification after delay
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const updateCommand = useCallback(
        (value: string) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data as RunCommandNodeData).command = value;
                    }
                }),
            );
        },
        [id, setNodes],
    );

    const executeCommand = useCallback(() => {
        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as RunCommandNodeData;
                    nodeData.status = "running";
                    nodeData.output = "";
                    nodeData.errorMessage = undefined;

                    // Simulate command execution - in real implementation, this would connect to the Pi and run the command
                    setTimeout(() => {
                        setNodes((nodes) =>
                            produce(nodes, (draft) => {
                                const node = draft.find((n) => n.id === id);
                                if (node) {
                                    const nodeData = node.data as RunCommandNodeData;
                                    if (nodeData.command.trim()) {
                                        nodeData.status = "success";
                                        nodeData.output = `$ ${nodeData.command}\n> Command executed successfully at ${new Date().toLocaleTimeString()}`;
                                        setShowSuccess(true);

                                        // Simulate different outputs based on common commands
                                        if (nodeData.command.includes("ls")) {
                                            nodeData.output += "\n> file1.txt  file2.txt  directory1/  directory2/";
                                        } else if (nodeData.command.includes("uname -a")) {
                                            nodeData.output += "\n> Linux raspberrypi 6.1.0-rpi7-rpi-v8 #1 SMP PREEMPT Debian 1:6.1.63-1+rpt1 (2023-11-24) aarch64 GNU/Linux";
                                        } else if (nodeData.command.includes("df -h")) {
                                            nodeData.output += "\n> Filesystem      Size  Used Avail Use% Mounted on\n> /dev/root       29G   12G   16G  44% /";
                                        }
                                    } else {
                                        nodeData.status = "error";
                                        nodeData.errorMessage = "Command cannot be empty";
                                    }
                                }
                            }),
                        );
                    }, 1000);
                }
            }),
        );
    }, [id, setNodes, setShowSuccess]);

    return (
        <div
            data-selected={selected}
            className="w-xs border border-dark-200 rounded-xl bg-dark-300/90 shadow-sm transition-all duration-300 divide-y divide-dark-200
                     data-[selected=true]:(border-red-500 ring-1 ring-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)])"
        >
            <div className="relative overflow-clip rounded-t-xl bg-dark-300">
                <div className="absolute inset-0">
                    <div className="absolute h-full w-3/5 from-red-600/20 to-transparent bg-gradient-to-r" />
                </div>

                <div className="relative h-9 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
                    <div className="flex grow items-center pl-0.5">
                        <div className="size-7 flex items-center justify-center">
                            <div className="size-6 flex items-center justify-center rounded-lg">
                                <div className={cn(meta.icon, "size-4 text-red-500 transition-transform duration-300", selected && "animate-pulse")} />
                            </div>
                        </div>

                        <div className="ml-1 text-xs font-medium leading-none tracking-wide uppercase op-80">
                            <span className="translate-y-px">{meta.title}</span>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
                        <button
                            type="button"
                            className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none transition-all duration-200 active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100 rotate-12)"
                            onClick={() => deleteNode(id)}
                        >
                            <div className="i-mynaui:trash size-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col divide-y divide-dark-200">
                <div className="relative min-h-10 flex flex-col">
                    <div className="flex flex-col p-4">
                        <div className="text-xs text-light-900/50 font-medium">Command</div>

                        <div className="mt-2 flex flex-col gap-3">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <span className="text-xs text-red-500 mr-1">$</span>
                                        <input
                                            type="text"
                                            value={data.command}
                                            onChange={(e) => updateCommand(e.target.value)}
                                            className="w-full h-8 px-2 border border-dark-100 rounded-md bg-dark-400 text-sm
                                                      focus:outline-none focus:border-red-500 transition-colors duration-200"
                                            placeholder="Enter command (e.g., ls -la)"
                                        />
                                    </div>
                                </div>
                                <button
                                    className={cn(
                                        "px-3 py-1.5 text-xs rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95",
                                        data.status === "running" ? "bg-yellow-500/20 text-yellow-400 cursor-wait" : "bg-red-500/20 text-red-400 hover:bg-red-500/30",
                                    )}
                                    onClick={executeCommand}
                                    disabled={data.status === "running"}
                                >
                                    {data.status === "running" ? (
                                        <span className="flex items-center">
                                            <div className="i-mdi:loading animate-spin mr-1 size-3" /> Running...
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <div className="i-mdi:play mr-1 size-3" /> Execute
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <CustomHandle
                        type="target"
                        id={targetHandleId}
                        position={Position.Left}
                        isConnectable={isConnectable}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-red-500/50 important:scale-110)"
                    />

                    <CustomHandle
                        type="source"
                        id={sourceHandleId}
                        position={Position.Right}
                        isConnectable={isConnectable && data.status === "success"}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-red-500/50 important:scale-110)"
                    />
                </div>

                <div className="flex flex-col p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-light-900/50 font-medium">Output</div>
                        <div className="flex items-center gap-2 group">
                            <div
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    data.status === "success" && "bg-green-500 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]",
                                    data.status === "running" && "bg-yellow-500 animate-pulse",
                                    data.status === "idle" && "bg-gray-500",
                                    data.status === "error" && "bg-red-500 animate-pulse",
                                )}
                            />
                            <div
                                className={cn(
                                    "text-xs font-medium capitalize transition-colors duration-300",
                                    data.status === "success" && "text-green-400",
                                    data.status === "running" && "text-yellow-400",
                                    data.status === "idle" && "text-gray-400",
                                    data.status === "error" && "text-red-400",
                                )}
                            >
                                {data.status}
                            </div>
                        </div>
                    </div>

                    {showSuccess && (
                        <div className="mt-2 py-1.5 px-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 animate-fadeIn flex items-center">
                            <div className="i-mdi:check-circle mr-1.5 size-4" />
                            Command executed successfully!
                        </div>
                    )}

                    {data.output && (
                        <div
                            className="mt-2 p-2 border border-dark-100 rounded-md bg-dark-600/70 text-xs font-mono text-light-900/80 whitespace-pre-wrap overflow-auto max-h-32
                                        transition-all duration-300 hover:border-dark-50"
                        >
                            {data.output}
                        </div>
                    )}

                    {data.errorMessage && <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 animate-pulse">{data.errorMessage}</div>}
                </div>

                <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
                    Node: <span className="text-light-900/60 font-semibold">#{id}</span>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<RunCommandNodeData> = {
    type: NODE_TYPE,
    node: memo(RunCommandNode),
    detail: {
        icon: "i-mdi:console",
        title: "Run Command",
        description: "Execute shell commands on the connected Raspberry Pi.",
    },
    defaultData: {
        command: "",
        output: "",
        status: "idle",
    },
};
