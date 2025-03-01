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
    // New fields for device info
    piModel?: string;
    piRam?: string;
}

type ConnectRaspberryPiNodeProps = NodeProps<Node<ConnectRaspberryPiNodeData, typeof NODE_TYPE>>;

export function ConnectRaspberryPiNode({ id, isConnectable, selected, data }: ConnectRaspberryPiNodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);

    // Add state for collapsible panel
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
    const [sourceHandleId] = useState<string>(nanoid());
    const [targetHandleId] = useState<string>(nanoid());
    const [showSuccess, setShowSuccess] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Add state for connection timer
    const [connectionStartTime, setConnectionStartTime] = useState<Date | null>(null);
    const [uptimeDisplay, setUptimeDisplay] = useState<string>("0:00:00");

    const { setNodes } = useReactFlow();
    const deleteNode = useDeleteNode();

    // Clear success notification after delay with fade-out
    useEffect(() => {
        if (showSuccess) {
            const fadeOutTimer = setTimeout(() => {
                setIsFadingOut(true);
            }, 2000);

            const removeTimer = setTimeout(() => {
                setShowSuccess(false);
                setIsFadingOut(false);
            }, 2500); // Wait for fade-out animation to complete

            return () => {
                clearTimeout(fadeOutTimer);
                clearTimeout(removeTimer);
            };
        }
    }, [showSuccess]);

    // Auto-collapse details when connected, expand when disconnected
    useEffect(() => {
        if (data.connectionStatus === "connected") {
            setIsDetailsExpanded(false);
        } else if (data.connectionStatus === "disconnected") {
            setIsDetailsExpanded(true);
        }
    }, [data.connectionStatus]);

    // Set connection start time when connected
    useEffect(() => {
        if (data.connectionStatus === "connected") {
            setConnectionStartTime(new Date());
        } else {
            setConnectionStartTime(null);
        }
    }, [data.connectionStatus]);

    // Update timer display every second
    useEffect(() => {
        if (data.connectionStatus === "connected" && connectionStartTime) {
            const timerInterval = setInterval(() => {
                const uptime = Date.now() - connectionStartTime.getTime();
                const seconds = Math.floor((uptime / 1000) % 60);
                const minutes = Math.floor((uptime / (1000 * 60)) % 60);
                const hours = Math.floor(uptime / (1000 * 60 * 60));

                setUptimeDisplay(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
            }, 1000);

            return () => clearInterval(timerInterval);
        }
    }, [connectionStartTime, data.connectionStatus]);

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
        // Validate form fields
        const errors = [];
        if (!data.hostname.trim()) errors.push("Hostname is required");
        if (!data.username.trim()) errors.push("Username is required");
        if (!data.port || data.port <= 0 || data.port > 65535) errors.push("Valid port number (1-65535) is required");

        if (errors.length > 0) {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        const nodeData = node.data as ConnectRaspberryPiNodeData;
                        nodeData.connectionStatus = "error";
                        nodeData.errorMessage = errors.join(", ");
                    }
                }),
            );
            return;
        }

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

                                        // Simulate getting device information
                                        // In a real implementation, these would come from the actual Pi
                                        nodeData.piModel = `Raspberry Pi ${Math.floor(Math.random() * 3) + 3}`; // Random Pi model 3-5
                                        nodeData.piRam = `${Math.pow(2, Math.floor(Math.random() * 3) + 1)} GB`; // 2, 4, or 8 GB

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
    }, [id, setNodes, data.hostname, data.username, data.port]);

    const disconnect = useCallback(() => {
        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as ConnectRaspberryPiNodeData;
                    nodeData.connectionStatus = "disconnected";
                    nodeData.errorMessage = undefined;
                    nodeData.piModel = undefined;
                    nodeData.piRam = undefined;
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
                    {/* Collapsible Connection Details Panel */}
                    <div className="flex flex-col">
                        <div
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-dark-300/30 transition-colors duration-200"
                            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                        >
                            <div className="text-xs text-light-900/50 font-medium flex items-center">
                                <div className="i-mdi:ethernet-cable mr-1.5 size-4" />
                                Connection Details
                            </div>
                            <div className={`i-mdi:chevron-down size-4 transition-transform duration-300 ${isDetailsExpanded ? "" : "-rotate-90"}`} />
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ${isDetailsExpanded ? "max-h-96" : "max-h-0"}`}>
                            <div className="p-4 pt-0">
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
                        </div>
                    </div>

                    <CustomHandle
                        type="target"
                        id={targetHandleId}
                        position={Position.Left}
                        isConnectable={isConnectable}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-red-500/50 important:scale-110)"
                    />

                    <div className="relative">
                        <CustomHandle
                            type="source"
                            id={sourceHandleId}
                            position={Position.Right}
                            isConnectable={isConnectable && data.connectionStatus === "connected"}
                            className={cn(
                                "top-6! transition-all duration-300",
                                data.connectionStatus === "connected"
                                    ? "hover:(important:ring-2 important:ring-green-500/50 important:scale-110) bg-green-500/80!"
                                    : "cursor-not-allowed hover:(important:ring-2 important:ring-gray-500/50) bg-gray-600/80!",
                            )}
                            onMouseEnter={() => data.connectionStatus !== "connected" && setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        />

                        {showTooltip && data.connectionStatus !== "connected" && (
                            <div className="absolute top-6 right-[-8px] transform translate-x-full translate-y-[-50%] px-2 py-1 bg-dark-400 border border-dark-100 rounded text-xs text-light-900 z-50 whitespace-nowrap shadow-md">
                                Connect to Raspberry Pi first
                            </div>
                        )}
                    </div>
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

                    {/* Connected Device Information */}
                    {data.connectionStatus === "connected" && (
                        <div
                            className="mt-3 py-2 px-3 bg-dark-400/40 border border-dark-200 rounded-md
                                       animate-slideInFromBottom hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]
                                       transition-all duration-300 hover:bg-dark-400/60 hover:border-dark-100
                                       hover:translate-y-[-1px] relative overflow-hidden group"
                        >
                            {/* Add a subtle shimmer effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>

                            <div className="text-xs text-light-900/70 font-medium mb-1 flex items-center">
                                <div className="i-mdi:server-network inline-block mr-1 size-3.5 animate-pulse text-green-400" />
                                <span className="animate-fadeIn">Connected Device</span>
                            </div>
                            {/* Add separator line that extends fully across */}
                            <div className="h-px bg-dark-200 w-[calc(100%+24px)] mb-2 mt-1.5 animate-fadeIn opacity-50 -mx-3"></div>
                            <div className="flex flex-col gap-1 text-[0.7rem] text-light-900/60">
                                <div className="flex items-center animate-fadeIn animation-delay-100 hover:translate-x-1 transition-transform duration-200">
                                    <div className="i-mdi:web inline-block mr-1.5 size-3" />
                                    <span className="font-medium">{data.hostname}</span>:{data.port}
                                </div>
                                <div className="flex items-center animate-fadeIn animation-delay-200 hover:translate-x-1 transition-transform duration-200">
                                    <div className="i-mdi:account inline-block mr-1.5 size-3" />
                                    <span className="font-medium">{data.username}</span>
                                </div>
                                <div className="flex items-center animate-fadeIn animation-delay-300 hover:translate-x-1 transition-transform duration-200">
                                    <div className="i-mdi:raspberry-pi inline-block mr-1.5 size-3 text-red-400 group-hover:rotate-12 transition-transform duration-300" />
                                    <span className="font-medium">{data.piModel || "Raspberry Pi"}</span>
                                    {data.piRam && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-[0.65rem] bg-dark-300/50 rounded border border-transparent hover:border-green-500/30 transition-colors duration-300 animate-fadeIn animation-delay-350 hover:bg-dark-300/80">
                                            {data.piRam} RAM
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center animate-fadeIn animation-delay-400 hover:translate-x-1 transition-transform duration-200 relative">
                                    <div className="i-mdi:check-circle inline-block mr-1.5 size-3 text-green-400" />
                                    <span className="relative after:content-['_'] after:animate-pulse">Ready to use</span>
                                </div>
                                {/* Add uptime timer */}
                                <div className="flex items-center animate-fadeIn animation-delay-450 hover:translate-x-1 transition-transform duration-200">
                                    <div className="i-mdi:timer-outline inline-block mr-1.5 size-3 text-blue-400 animate-pulse" />
                                    <span className="font-medium">Uptime:</span>
                                    <span className="ml-1">{uptimeDisplay}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {showSuccess && (
                        <div
                            className={`mt-2 py-1.5 px-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400
                       ${isFadingOut ? "animate-fadeOut" : "animate-fadeIn"} flex items-center
                       transition-opacity duration-300`}
                        >
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
        piModel: undefined,
        piRam: undefined,
    },
};
