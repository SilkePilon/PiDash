import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { type BaseNodeData, BuilderNode, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";

import { cn } from "~@/utils/cn";

const NODE_TYPE_LOOP = BuilderNode.LOOP;

export interface LoopNodeData extends BaseNodeData {
    iterations: number; // Number of times to loop
    delay: number; // Delay between iterations in ms
    currentIteration: number; // Current iteration
    status: "idle" | "running" | "paused" | "completed" | "error";
    errorMessage?: string;
}

type LoopNodeProps = NodeProps<Node<LoopNodeData, typeof NODE_TYPE_LOOP>>;

export function LoopNode({ id, isConnectable, selected, data }: LoopNodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE_LOOP), []);

    const [sourceHandleId] = useState<string>(nanoid());
    const [targetHandleId] = useState<string>(nanoid());
    const [showSuccess, setShowSuccess] = useState(false);
    const [animating, setAnimating] = useState(false);

    const { setNodes } = useReactFlow();
    const deleteNode = useDeleteNode();

    // Reference to store interval ID for cleanup
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Clear success notification after delay
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    // Clean up interval on component unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const updateLoopSettings = useCallback(
        (field: keyof Omit<LoopNodeData, "currentIteration" | "status" | "errorMessage">, value: number) => {
            setAnimating(true);

            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data as LoopNodeData)[field] = value;
                    }
                }),
            );

            setTimeout(() => {
                setAnimating(false);
            }, 300);
        },
        [id, setNodes],
    );

    const startLoop = useCallback(() => {
        // Reset current iteration and set status to running
        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as LoopNodeData;
                    nodeData.currentIteration = 0;
                    nodeData.status = "running";
                    nodeData.errorMessage = undefined;
                }
            }),
        );

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Start the loop
        let currentIteration = 0;

        const startTime = performance.now();
        const interval = setInterval(() => {
            currentIteration += 1;

            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        const nodeData = node.data as LoopNodeData;
                        nodeData.currentIteration = currentIteration;

                        // Check if we've reached the target iterations
                        if (currentIteration >= nodeData.iterations) {
                            nodeData.status = "completed";
                            clearInterval(interval);
                            intervalRef.current = null;

                            // Calculate actual execution time
                            const executionTime = performance.now() - startTime;
                            setShowSuccess(true);

                            // Show completion notification
                            nodeData.errorMessage = `Loop completed in ${Math.round(executionTime / 100) / 10}s`;
                        }
                    }
                }),
            );

            setAnimating(true);
            setTimeout(() => setAnimating(false), 300);
        }, data.delay);

        intervalRef.current = interval;
    }, [id, setNodes, data.delay]);

    const pauseLoop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;

            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data as LoopNodeData).status = "paused";
                    }
                }),
            );
        }
    }, [id, setNodes]);

    const stopLoop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as LoopNodeData;
                    nodeData.status = "idle";
                    nodeData.currentIteration = 0;
                    nodeData.errorMessage = undefined;
                }
            }),
        );
    }, [id, setNodes]);

    const continueLoop = useCallback(() => {
        if (data.status === "paused") {
            // Continue from where we left off
            let currentIteration = data.currentIteration;

            const interval = setInterval(() => {
                currentIteration += 1;

                setNodes((nodes) =>
                    produce(nodes, (draft) => {
                        const node = draft.find((n) => n.id === id);
                        if (node) {
                            const nodeData = node.data as LoopNodeData;
                            nodeData.currentIteration = currentIteration;
                            nodeData.status = "running";

                            // Check if we've reached the target iterations
                            if (currentIteration >= nodeData.iterations) {
                                nodeData.status = "completed";
                                clearInterval(interval);
                                intervalRef.current = null;
                                setShowSuccess(true);
                            }
                        }
                    }),
                );

                setAnimating(true);
                setTimeout(() => setAnimating(false), 300);
            }, data.delay);

            intervalRef.current = interval;

            // Update status immediately
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data as LoopNodeData).status = "running";
                    }
                }),
            );
        }
    }, [id, setNodes, data.status, data.currentIteration, data.delay]);

    // Format the delay time nicely
    const formattedDelay = useMemo(() => {
        if (data.delay < 1000) {
            return `${data.delay}ms`;
        }
        return `${(data.delay / 1000).toFixed(1)}s`;
    }, [data.delay]);

    return (
        <div
            data-selected={selected}
            className="w-xs border border-dark-200 rounded-xl bg-dark-300/90 shadow-sm transition-all duration-300 divide-y divide-dark-200
             data-[selected=true]:(border-purple-600 ring-1 ring-purple-600/50)"
        >
            <div className="relative overflow-clip rounded-t-xl bg-dark-300">
                <div className="absolute inset-0">
                    <div className="absolute h-full w-3/5 from-purple-800/20 to-transparent bg-gradient-to-r" />
                </div>

                <div className="relative h-9 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
                    <div className="flex grow items-center pl-0.5">
                        <div className="size-7 flex items-center justify-center">
                            <div className="size-6 flex items-center justify-center rounded-lg">
                                <div className={cn(meta.icon, "size-4 text-purple-400 transition-transform duration-300", selected && "animate-pulse")} />
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
                        <div className="text-xs text-light-900/50 font-medium mb-2">Loop Settings</div>

                        <div className="flex flex-col gap-3">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label htmlFor={`iterations-${id}`} className="text-xs text-light-900/70">
                                        Iterations
                                    </label>
                                    <span className={cn("text-xs transition-all duration-200", animating && "text-red-400")}>
                                        {data.currentIteration} / {data.iterations}
                                    </span>
                                </div>
                                <input
                                    id={`iterations-${id}`}
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={data.iterations}
                                    onChange={(e) => updateLoopSettings("iterations", parseInt(e.target.value))}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="w-full h-5 cursor-pointer appearance-none bg-dark-500 border border-dark-100 rounded-md
                                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                                              [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-sm
                                              [&::-webkit-slider-thumb]:bg-purple-500 hover:[&::-webkit-slider-thumb]:bg-purple-400
                                              [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-dark-100
                                              [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110
                                              focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                                    style={{
                                        background: `linear-gradient(to right, rgb(147 51 234 / 0.5) 0%, rgb(147 51 234 / 0.5) ${(data.iterations / 100) * 100}%, rgba(15, 23, 42, 0.3) ${(data.iterations / 100) * 100}%, rgba(15, 23, 42, 0.3) 100%)`,
                                    }}
                                    disabled={data.status === "running"}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label htmlFor={`delay-${id}`} className="text-xs text-light-900/70">
                                        Delay
                                    </label>
                                    <span className={cn("text-xs transition-all duration-200", animating && "text-red-400")}>{formattedDelay}</span>
                                </div>
                                <input
                                    id={`delay-${id}`}
                                    type="range"
                                    min="100"
                                    max="5000"
                                    step="100"
                                    value={data.delay}
                                    onChange={(e) => updateLoopSettings("delay", parseInt(e.target.value))}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="w-full h-5 cursor-pointer appearance-none bg-dark-500 border border-dark-100 rounded-md
                                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                                              [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-sm
                                              [&::-webkit-slider-thumb]:bg-purple-500 hover:[&::-webkit-slider-thumb]:bg-purple-400
                                              [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-dark-100
                                              [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110
                                              focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                                    style={{
                                        background: `linear-gradient(to right, rgb(147 51 234 / 0.5) 0%, rgb(147 51 234 / 0.5) ${(data.delay / 5000) * 100}%, rgba(15, 23, 42, 0.3) ${(data.delay / 5000) * 100}%, rgba(15, 23, 42, 0.3) 100%)`,
                                    }}
                                    disabled={data.status === "running"}
                                />
                            </div>

                            {/* Progress bar for current iteration */}
                            {data.status !== "idle" && data.iterations > 0 && (
                                <div>
                                    <div className="text-xs text-light-900/70 mb-1">Progress</div>
                                    <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-200",
                                                data.status === "running" && "bg-blue-500",
                                                data.status === "paused" && "bg-yellow-500",
                                                data.status === "completed" && "bg-green-500",
                                            )}
                                            style={{ width: `${(data.currentIteration / data.iterations) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 mt-1">
                                {data.status === "idle" || data.status === "completed" ? (
                                    <button
                                        className="flex-1 px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30
                                                  transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                                        onClick={startLoop}
                                    >
                                        <div className="i-mdi:play mr-1.5 size-3.5" />
                                        Start Loop
                                    </button>
                                ) : data.status === "paused" ? (
                                    <>
                                        <button
                                            className="flex-1 px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30
                                                      transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                                            onClick={continueLoop}
                                        >
                                            <div className="i-mdi:play mr-1.5 size-3.5" />
                                            Continue
                                        </button>
                                        <button
                                            className="flex-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30
                                                      transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                                            onClick={stopLoop}
                                        >
                                            <div className="i-mdi:stop mr-1.5 size-3.5" />
                                            Stop
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="flex-1 px-3 py-1.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-md hover:bg-yellow-500/30
                                                      transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                                            onClick={pauseLoop}
                                        >
                                            <div className="i-mdi:pause mr-1.5 size-3.5" />
                                            Pause
                                        </button>
                                        <button
                                            className="flex-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30
                                                      transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                                            onClick={stopLoop}
                                        >
                                            <div className="i-mdi:stop mr-1.5 size-3.5" />
                                            Stop
                                        </button>
                                    </>
                                )}
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
                        isConnectable={isConnectable && data.status !== "error"}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-red-500/50 important:scale-110)"
                    />
                </div>

                <div className="flex flex-col p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-light-900/50 font-medium">Status</div>
                        <div className="flex items-center gap-2 group">
                            <div
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    data.status === "running" && "bg-blue-500 animate-pulse group-hover:shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                                    data.status === "paused" && "bg-yellow-500 group-hover:shadow-[0_0_8px_rgba(234,179,8,0.5)]",
                                    data.status === "idle" && "bg-gray-500",
                                    data.status === "completed" && "bg-green-500 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]",
                                    data.status === "error" && "bg-red-500 animate-pulse",
                                )}
                            />
                            <div
                                className={cn(
                                    "text-xs font-medium capitalize transition-colors duration-300",
                                    data.status === "running" && "text-blue-400",
                                    data.status === "paused" && "text-yellow-400",
                                    data.status === "idle" && "text-gray-400",
                                    data.status === "completed" && "text-green-400",
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
                            Loop completed successfully!
                        </div>
                    )}

                    {data.errorMessage && data.status === "completed" && (
                        <div className="mt-2 py-1.5 px-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400">{data.errorMessage}</div>
                    )}

                    {data.errorMessage && data.status === "error" && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 animate-pulse">{data.errorMessage}</div>
                    )}
                </div>

                <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
                    Node: <span className="text-light-900/60 font-semibold">#{id}</span>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<LoopNodeData> = {
    type: NODE_TYPE_LOOP,
    node: memo(LoopNode),
    detail: {
        icon: "i-mdi:loop",
        title: "Loop",
        description: "Loop execution of connected nodes with a configurable delay.",
    },
    defaultData: {
        iterations: 5,
        delay: 1000,
        currentIteration: 0,
        status: "idle",
    },
};
