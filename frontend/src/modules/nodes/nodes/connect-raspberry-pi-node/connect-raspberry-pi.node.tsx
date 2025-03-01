import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState, useEffect } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { type BaseNodeData, BuilderNode, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";

import { cn } from "~@/utils/cn";

const NODE_TYPE = BuilderNode.CONNECT_RASPBERRY_PI;

export interface ConnectRaspberryPiNodeData extends BaseNodeData {
    hostname: string;
    port: number;
    username: string;
    password: string;
    connectionStatus: "disconnected" | "connecting" | "connected" | "error";
    errorMessage?: string;
}

type ConnectRaspberryPiNodeProps = NodeProps<Node<ConnectRaspberryPiNodeData, typeof NODE_TYPE>>;

export function ConnectRaspberryPiNode({ id, isConnectable, selected, data }: ConnectRaspberryPiNodeProps) {
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

    const updateConnectionDetails = useCallback(
        (field: keyof Omit<ConnectRaspberryPiNodeData, "connectionStatus" | "errorMessage">, value: string | number) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data as ConnectRaspberryPiNodeData)[field] = value;
                    }
                }),
            );
        },
        [id, setNodes],
    );

    const connect = useCallback(() => {
        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as ConnectRaspberryPiNodeData;
                    nodeData.connectionStatus = "connecting";
                    nodeData.errorMessage = undefined;

                    // Simulate connecting - in real implementation, this would be a real connection
                    setTimeout(() => {
                        setNodes((nodes) =>
                            produce(nodes, (draft) => {
                                const node = draft.find((n) => n.id === id);
                                if (node) {
                                    const nodeData = node.data as ConnectRaspberryPiNodeData;
                                    if (nodeData.hostname && nodeData.username) {
                                        nodeData.connectionStatus = "connected";
                                        setShowSuccess(true);
                                    } else {
                                        nodeData.connectionStatus = "error";
                                        nodeData.errorMessage = "Invalid connection details";
                                    }
                                }
                            }),
                        );
                    }, 1500);
                }
            }),
        );
    }, [id, setNodes]);

    const disconnect = useCallback(() => {
        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as ConnectRaspberryPiNodeData;
                    nodeData.connectionStatus = "disconnected";
                    nodeData.errorMessage = undefined;
                }
            }),
        );
    }, [id, setNodes]);

    return (
        <div
            data-selected={selected}
            className="w-xs border border-dark-200 rounded-xl bg-dark-300/50 shadow-sm backdrop-blur-xl transition-all duration-300 divide-y divide-dark-200
            data-[selected=true]:(border-red-500 ring-1 ring-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)])"
        >
            <div className="relative overflow-clip rounded-t-xl bg-dark-300/50">
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
                        <div className="text-xs text-light-900/50 font-medium">Connection Details</div>

                        <div className="mt-2 flex flex-col gap-3">
                            <div>
                                <label htmlFor={`hostname-${id}`} className="text-xs text-light-900/70 mb-1 block">
                                    Hostname / IP
                                </label>
                                <input
                                    id={`hostname-${id}`}
                                    type="text"
                                    value={data.hostname}
                                    onChange={(e) => updateConnectionDetails("hostname", e.target.value)}
                                    className="w-full h-8 px-2 border border-dark-100 rounded-md bg-dark-400 text-sm
                                              focus:outline-none focus:border-red-500 transition-colors duration-200"
                                    placeholder="raspberrypi.local"
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label htmlFor={`port-${id}`} className="text-xs text-light-900/70 mb-1 block">
                                        Port
                                    </label>
                                    <input
                                        id={`port-${id}`}
                                        type="number"
                                        value={data.port}
                                        onChange={(e) => updateConnectionDetails("port", parseInt(e.target.value))}
                                        className="w-full h-8 px-2 border border-dark-100 rounded-md bg-dark-400 text-sm
                                                  focus:outline-none focus:border-red-500 transition-colors duration-200"
                                        placeholder="22"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor={`username-${id}`} className="text-xs text-light-900/70 mb-1 block">
                                    Username
                                </label>
                                <input
                                    id={`username-${id}`}
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => updateConnectionDetails("username", e.target.value)}
                                    className="w-full h-8 px-2 border border-dark-100 rounded-md bg-dark-400 text-sm
                                              focus:outline-none focus:border-red-500 transition-colors duration-200"
                                    placeholder="pi"
                                />
                            </div>

                            <div>
                                <label htmlFor={`password-${id}`} className="text-xs text-light-900/70 mb-1 block">
                                    Password
                                </label>
                                <input
                                    id={`password-${id}`}
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => updateConnectionDetails("password", e.target.value)}
                                    className="w-full h-8 px-2 border border-dark-100 rounded-md bg-dark-400 text-sm
                                              focus:outline-none focus:border-red-500 transition-colors duration-200"
                                />
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
                        isConnectable={isConnectable && data.connectionStatus === "connected"}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-red-500/50 important:scale-110)"
                    />
                </div>

                <div className="flex flex-col p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 group">
                            <div
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    data.connectionStatus === "connected" && "bg-green-500 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]",
                                    data.connectionStatus === "connecting" && "bg-yellow-500 animate-pulse",
                                    data.connectionStatus === "disconnected" && "bg-gray-500",
                                    data.connectionStatus === "error" && "bg-red-500 animate-pulse",
                                )}
                            />
                            <div
                                className={cn(
                                    "text-xs font-medium capitalize transition-colors duration-300",
                                    data.connectionStatus === "connected" && "text-green-400",
                                    data.connectionStatus === "connecting" && "text-yellow-400",
                                    data.connectionStatus === "disconnected" && "text-gray-400",
                                    data.connectionStatus === "error" && "text-red-400",
                                )}
                            >
                                {data.connectionStatus}
                            </div>
                        </div>

                        {data.connectionStatus === "connected" || data.connectionStatus === "connecting" ? (
                            <button
                                className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30
                                          transition-all duration-200 transform hover:scale-105 active:scale-95"
                                onClick={disconnect}
                                disabled={data.connectionStatus === "connecting"}
                            >
                                Disconnect
                            </button>
                        ) : (
                            <button
                                className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30
                                          transition-all duration-200 transform hover:scale-105 active:scale-95"
                                onClick={connect}
                            >
                                Connect
                            </button>
                        )}
                    </div>

                    {showSuccess && (
                        <div className="mt-2 py-1.5 px-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 animate-fadeIn flex items-center">
                            <div className="i-mdi:check-circle mr-1.5 size-4" />
                            Connection established successfully!
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
export const metadata: RegisterNodeMetadata<ConnectRaspberryPiNodeData> = {
    type: NODE_TYPE,
    node: memo(ConnectRaspberryPiNode),
    detail: {
        icon: "i-mdi:raspberry-pi",
        title: "Connect Raspberry Pi",
        description: "Connect to a Raspberry Pi device.",
    },
    defaultData: {
        hostname: "",
        port: 22,
        username: "pi",
        password: "",
        connectionStatus: "disconnected",
    },
};
