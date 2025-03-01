import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState, useEffect } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { type BaseNodeData, BuilderNode, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";

import { cn } from "~@/utils/cn";

// You'll need to add this to your BuilderNode enum in types.ts
const NODE_TYPE = "gpio" as BuilderNode;

export type PinMode = "input" | "output" | "pwm";
export type PinState = "high" | "low" | number; // number for PWM (0-100)

export interface PinData {
    pinNumber: number;
    name: string;
    mode: PinMode;
    state: PinState;
    animating?: boolean; // Track animation state
}

export interface GPIONodeData extends BaseNodeData {
    pins: Record<number, PinData>;
    pinNumberingScheme: "bcm" | "physical";
    status: "disconnected" | "connected" | "error";
    errorMessage?: string;
}

type GPIONodeProps = NodeProps<Node<GPIONodeData, typeof NODE_TYPE>>;

// Standard Raspberry Pi GPIO pins with their BCM numbers
const standardPins: Omit<PinData, "mode" | "state">[] = [
    { pinNumber: 2, name: "GPIO 2 (SDA)" },
    { pinNumber: 3, name: "GPIO 3 (SCL)" },
    { pinNumber: 4, name: "GPIO 4" },
    { pinNumber: 17, name: "GPIO 17" },
    { pinNumber: 27, name: "GPIO 27" },
    { pinNumber: 22, name: "GPIO 22" },
    { pinNumber: 10, name: "GPIO 10 (MOSI)" },
    { pinNumber: 9, name: "GPIO 9 (MISO)" },
    { pinNumber: 11, name: "GPIO 11 (SCLK)" },
    { pinNumber: 5, name: "GPIO 5" },
    { pinNumber: 6, name: "GPIO 6" },
    { pinNumber: 13, name: "GPIO 13" },
    { pinNumber: 19, name: "GPIO 19" },
    { pinNumber: 26, name: "GPIO 26" },
    { pinNumber: 16, name: "GPIO 16" },
    { pinNumber: 20, name: "GPIO 20" },
    { pinNumber: 21, name: "GPIO 21" },
];

export function GPIONode({ id, isConnectable, selected, data }: GPIONodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);

    const [sourceHandleId] = useState<string>(nanoid());
    const [targetHandleId] = useState<string>(nanoid());
    const [expandedPinGroups, setExpandedPinGroups] = useState<Record<string, boolean>>({
        basic: false,
        advanced: false,
    });
    const [animatingPin, setAnimatingPin] = useState<number | null>(null);
    const [connectingAnimation, setConnectingAnimation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const { setNodes } = useReactFlow();
    const deleteNode = useDeleteNode();

    // Clear animation states after delays
    useEffect(() => {
        if (animatingPin !== null) {
            const timer = setTimeout(() => {
                setAnimatingPin(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [animatingPin]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const togglePinGroup = useCallback((group: string) => {
        setExpandedPinGroups((prev) => ({
            ...prev,
            [group]: !prev[group],
        }));
    }, []);

    const updatePinMode = useCallback(
        (pinNumber: number, mode: PinMode) => {
            setAnimatingPin(pinNumber);

            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        const nodeData = node.data as GPIONodeData;
                        if (!nodeData.pins[pinNumber]) {
                            const pinInfo = standardPins.find((p) => p.pinNumber === pinNumber);
                            nodeData.pins[pinNumber] = {
                                pinNumber,
                                name: pinInfo?.name || `GPIO ${pinNumber}`,
                                mode,
                                state: mode === "pwm" ? 0 : "low",
                                animating: true,
                            };
                        } else {
                            nodeData.pins[pinNumber].mode = mode;
                            // Reset state when changing modes
                            nodeData.pins[pinNumber].state = mode === "pwm" ? 0 : "low";
                            nodeData.pins[pinNumber].animating = true;
                        }
                    }
                }),
            );

            // Clear animation flag after delay
            setTimeout(() => {
                setNodes((nodes) =>
                    produce(nodes, (draft) => {
                        const node = draft.find((n) => n.id === id);
                        if (node) {
                            const nodeData = node.data as GPIONodeData;
                            if (nodeData.pins[pinNumber]) {
                                nodeData.pins[pinNumber].animating = false;
                            }
                        }
                    }),
                );
            }, 500);
        },
        [id, setNodes],
    );

    const updatePinState = useCallback(
        (pinNumber: number, state: PinState) => {
            setAnimatingPin(pinNumber);

            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        const nodeData = node.data as GPIONodeData;
                        if (nodeData.pins[pinNumber]) {
                            nodeData.pins[pinNumber].state = state;
                            nodeData.pins[pinNumber].animating = true;
                        }
                    }
                }),
            );

            // Clear animation flag after delay
            setTimeout(() => {
                setNodes((nodes) =>
                    produce(nodes, (draft) => {
                        const node = draft.find((n) => n.id === id);
                        if (node) {
                            const nodeData = node.data as GPIONodeData;
                            if (nodeData.pins[pinNumber]) {
                                nodeData.pins[pinNumber].animating = false;
                            }
                        }
                    }),
                );
            }, 500);
        },
        [id, setNodes],
    );

    const updatePinNumberingScheme = useCallback(
        (scheme: "bcm" | "physical") => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data as GPIONodeData).pinNumberingScheme = scheme;
                    }
                }),
            );
        },
        [id, setNodes],
    );

    const checkConnection = useCallback(() => {
        // Show connecting animation
        setConnectingAnimation(true);

        setTimeout(() => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        const nodeData = node.data as GPIONodeData;
                        nodeData.status = "connected";
                        nodeData.errorMessage = undefined;
                    }
                }),
            );

            setConnectingAnimation(false);
            setShowSuccess(true);
        }, 1500);
    }, [id, setNodes]);

    const renderPin = (pinInfo: Omit<PinData, "mode" | "state">) => {
        const pin = data.pins[pinInfo.pinNumber] || {
            pinNumber: pinInfo.pinNumber,
            name: pinInfo.name,
            mode: "input" as PinMode,
            state: "low" as PinState,
        };

        const isAnimating = pin.animating || animatingPin === pin.pinNumber;

        return (
            <div
                key={pin.pinNumber}
                className={cn(
                    "flex flex-col border border-dark-100 rounded-md p-2 bg-dark-400/30 transition-all duration-200",
                    isAnimating && "shadow-[0_0_8px_rgba(239,68,68,0.5)]",
                    selected && pin.mode === "output" && pin.state === "high" && "shadow-[0_0_5px_rgba(34,197,94,0.3)]",
                )}
            >
                <div className="flex justify-between items-center">
                    <span className={cn("text-xs font-medium transition-colors duration-300", isAnimating && "text-red-400")}>{pin.name}</span>
                    <span
                        className={cn(
                            "text-xs rounded-full px-1.5 py-0.5 transition-all duration-300 ease-in-out",
                            pin.mode === "input" ? "bg-blue-500/20 text-blue-400" : pin.mode === "output" ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400",
                            isAnimating && "transform scale-110",
                        )}
                    >
                        {pin.mode}
                    </span>
                </div>

                <div className="flex mt-2 gap-2">
                    <select
                        value={pin.mode}
                        onChange={(e) => updatePinMode(pin.pinNumber, e.target.value as PinMode)}
                        className="text-xs bg-dark-500 border border-dark-100 rounded py-1 px-1.5 flex-1
                                  transition-colors duration-200 hover:border-red-500/30 focus:border-red-500
                                  focus:outline-none cursor-pointer"
                    >
                        <option value="input">Input</option>
                        <option value="output">Output</option>
                        <option value="pwm">PWM</option>
                    </select>

                    {pin.mode === "input" ? (
                        <div
                            className={cn(
                                "rounded px-2 py-1 text-xs flex items-center transition-all duration-300",
                                pin.state === "high" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400",
                            )}
                        >
                            {pin.state === "high" ? "HIGH" : "LOW"}
                        </div>
                    ) : pin.mode === "output" ? (
                        <button
                            onClick={() => updatePinState(pin.pinNumber, pin.state === "high" ? "low" : "high")}
                            className={cn(
                                "rounded px-3 py-1 text-xs transition-all duration-300 transform",
                                pin.state === "high" ? "bg-green-500/20 text-green-400 hover:bg-green-500/40" : "bg-dark-100 text-gray-400 hover:bg-dark-50",
                                isAnimating && "scale-105",
                            )}
                        >
                            {pin.state === "high" ? "HIGH" : "LOW"}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 flex-1 group">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={typeof pin.state === "number" ? pin.state : 0}
                                onChange={(e) => updatePinState(pin.pinNumber, parseInt(e.target.value))}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="flex-1 h-5 cursor-pointer appearance-none bg-dark-500 border border-dark-100 rounded-md
                                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                                          [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-sm
                                          [&::-webkit-slider-thumb]:bg-red-500 hover:[&::-webkit-slider-thumb]:bg-red-400
                                          [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-dark-100
                                          [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110
                                          focus:outline-none focus:ring-1 focus:ring-red-500/30"
                                style={{
                                    background:
                                        typeof pin.state === "number"
                                            ? `linear-gradient(to right, rgb(239 68 68 / 0.5) 0%, rgb(239 68 68 / 0.5) ${pin.state}%, rgba(15, 23, 42, 0.3) ${pin.state}%, rgba(15, 23, 42, 0.3) 100%)`
                                            : undefined,
                                }}
                            />
                            <span className={cn("text-xs w-8 text-right transition-all duration-200", isAnimating && "text-red-400 font-medium")}>
                                {typeof pin.state === "number" ? pin.state : 0}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const basicPins = standardPins.slice(0, 8);
    const advancedPins = standardPins.slice(8);

    return (
        <div
            data-selected={selected}
            className="w-xs border border-dark-200 rounded-xl bg-dark-300/90 shadow-sm transition-all duration-300 divide-y divide-dark-200
              data-[selected=true]:(border-red-500 ring-1 ring-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)])"
        >
            <div className="relative overflow-clip rounded-t-xl bg-dark-300">
                <div className="absolute inset-0"></div>
                <div className="absolute h-full w-3/5 from-red-600/20 to-transparent bg-gradient-to-r" />

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
                <div className="relative p-4">
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-xs font-medium text-light-900/70">Pin Numbering</div>

                        <div className="flex rounded-md overflow-hidden border border-dark-100">
                            <button
                                onClick={() => updatePinNumberingScheme("bcm")}
                                className={cn(
                                    "px-2 py-1 text-xs transition-all duration-200",
                                    data.pinNumberingScheme === "bcm" ? "bg-red-500/20 text-red-400" : "bg-dark-400 text-light-900/50 hover:bg-dark-300",
                                )}
                            >
                                BCM
                            </button>
                            <button
                                onClick={() => updatePinNumberingScheme("physical")}
                                className={cn(
                                    "px-2 py-1 text-xs transition-all duration-200",
                                    data.pinNumberingScheme === "physical" ? "bg-red-500/20 text-red-400" : "bg-dark-400 text-light-900/50 hover:bg-dark-300",
                                )}
                            >
                                Physical
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                        <div className="text-xs font-medium text-light-900/70">Connection Status</div>

                        <div className="flex items-center gap-2 group">
                            <div
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    data.status === "connected" && "bg-green-500 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]",
                                    data.status === "disconnected" && "bg-gray-500",
                                    data.status === "error" && "bg-red-500 animate-pulse",
                                    connectingAnimation && "animate-pulse bg-yellow-500",
                                )}
                            />
                            <div
                                className={cn(
                                    "text-xs font-medium capitalize transition-colors duration-300",
                                    data.status === "connected" && "text-green-400",
                                    data.status === "disconnected" && "text-gray-400",
                                    data.status === "error" && "text-red-400",
                                    connectingAnimation && "text-yellow-400",
                                )}
                            >
                                {connectingAnimation ? "Connecting..." : data.status}
                            </div>
                            {data.status === "disconnected" && (
                                <button
                                    className={cn(
                                        "px-2 py-1 ml-2 text-xs rounded-md transition-all duration-200 transform",
                                        connectingAnimation ? "bg-yellow-500/20 text-yellow-400 cursor-wait" : "bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:scale-105 active:scale-95",
                                    )}
                                    onClick={checkConnection}
                                    disabled={connectingAnimation}
                                >
                                    {connectingAnimation ? (
                                        <span className="flex items-center">
                                            <div className="i-mdi:loading animate-spin mr-1 size-3" />
                                            Checking...
                                        </span>
                                    ) : (
                                        "Check Connection"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {showSuccess && (
                        <div className="mb-3 py-1.5 px-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 animate-fadeIn flex items-center">
                            <div className="i-mdi:check-circle mr-1.5 size-4" />
                            Connection established successfully!
                        </div>
                    )}

                    {/* Basic GPIO Pins Group */}
                    <div className="mb-2 border border-dark-100 rounded-md overflow-hidden">
                        <button
                            className="w-full flex justify-between items-center p-2 bg-dark-400/30 text-xs font-medium hover:bg-dark-400/50 transition-colors duration-200"
                            onClick={() => togglePinGroup("basic")}
                        >
                            <span>Basic GPIO Pins</span>
                            <span className={cn("i-mdi:chevron-down transition-transform duration-300 ease-in-out", expandedPinGroups.basic && "rotate-180")}></span>
                        </button>

                        <div
                            className={cn(
                                "grid gap-2 transition-all duration-300 ease-in-out origin-top",
                                expandedPinGroups.basic ? "p-2 scale-y-100 opacity-100" : "h-0 scale-y-0 opacity-0 overflow-hidden",
                            )}
                        >
                            {basicPins.map((pin) => renderPin(pin))}
                        </div>
                    </div>

                    {/* Advanced GPIO Pins Group */}
                    <div className="border border-dark-100 rounded-md overflow-hidden">
                        <button
                            className="w-full flex justify-between items-center p-2 bg-dark-400/30 text-xs font-medium hover:bg-dark-400/50 transition-colors duration-200"
                            onClick={() => togglePinGroup("advanced")}
                        >
                            <span>Advanced GPIO Pins</span>
                            <span className={cn("i-mdi:chevron-down transition-transform duration-300 ease-in-out", expandedPinGroups.advanced && "rotate-180")}></span>
                        </button>

                        <div
                            className={cn(
                                "grid gap-2 transition-all duration-300 ease-in-out origin-top",
                                expandedPinGroups.advanced ? "p-2 scale-y-100 opacity-100" : "h-0 scale-y-0 opacity-0 overflow-hidden",
                            )}
                        >
                            {advancedPins.map((pin) => renderPin(pin))}
                        </div>
                    </div>

                    {data.errorMessage && <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 animate-pulse">{data.errorMessage}</div>}

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
                        isConnectable={isConnectable && data.status === "connected"}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-red-500/50 important:scale-110)"
                    />
                </div>

                <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
                    Node: <span className="text-light-900/60 font-semibold">#{id}</span>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<GPIONodeData> = {
    type: NODE_TYPE,
    node: memo(GPIONode),
    detail: {
        icon: "i-mdi:led-variant-on",
        title: "Raspberry Pi GPIO",
        description: "Control GPIO pins on the connected Raspberry Pi.",
    },
    defaultData: {
        pins: {},
        pinNumberingScheme: "bcm",
        status: "disconnected",
    },
};
