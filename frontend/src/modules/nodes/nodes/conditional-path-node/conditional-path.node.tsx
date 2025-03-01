import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState, useEffect } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { type BaseNodeData, BuilderNode, type RegisterNodeMetadata } from "~/modules/nodes/types";

import { cn } from "~@/utils/cn";

// Define condition categories with their associated paths
const conditionCategories = [
    {
        id: "network",
        name: "Network Conditions",
        icon: "i-mdi:wifi",
        color: "text-cyan-400",
        conditions: [
            { id: nanoid(), condition: "Network connectivity" },
            { id: nanoid(), condition: "Wi-Fi signal strength" },
            { id: nanoid(), condition: "Internet connection" },
        ],
        defaultPaths: [
            { id: nanoid(), value: "Connected" },
            { id: nanoid(), value: "Disconnected" },
            { id: nanoid(), value: "Unstable" },
        ],
    },
    {
        id: "cpu",
        name: "CPU Conditions",
        icon: "i-mdi:cpu-64-bit",
        color: "text-orange-400",
        conditions: [
            { id: nanoid(), condition: "CPU temperature" },
            { id: nanoid(), condition: "CPU utilization" },
            { id: nanoid(), condition: "CPU frequency" },
        ],
        defaultPaths: [
            { id: nanoid(), value: "Above Threshold" },
            { id: nanoid(), value: "Below Threshold" },
            { id: nanoid(), value: "Critical" },
            { id: nanoid(), value: "Normal" },
        ],
    },
    {
        id: "memory",
        name: "Memory Conditions",
        icon: "i-mdi:memory",
        color: "text-blue-400",
        conditions: [
            { id: nanoid(), condition: "Memory usage" },
            { id: nanoid(), condition: "Swap usage" },
            { id: nanoid(), condition: "Memory availability" },
        ],
        defaultPaths: [
            { id: nanoid(), value: "High Usage" },
            { id: nanoid(), value: "Low Usage" },
            { id: nanoid(), value: "Sufficient" },
            { id: nanoid(), value: "Insufficient" },
        ],
    },
    {
        id: "storage",
        name: "Storage Conditions",
        icon: "i-mdi:harddisk",
        color: "text-purple-400",
        conditions: [
            { id: nanoid(), condition: "Storage space" },
            { id: nanoid(), condition: "Disk I/O rate" },
            { id: nanoid(), condition: "Disk health" },
        ],
        defaultPaths: [
            { id: nanoid(), value: "Sufficient" },
            { id: nanoid(), value: "Low" },
            { id: nanoid(), value: "Critical" },
            { id: nanoid(), value: "Healthy" },
            { id: nanoid(), value: "Degraded" },
        ],
    },
    {
        id: "gpio",
        name: "GPIO Conditions",
        icon: "i-mdi:controller",
        color: "text-green-400",
        conditions: [
            { id: nanoid(), condition: "GPIO pin state" },
            { id: nanoid(), condition: "GPIO input signal" },
            { id: nanoid(), condition: "GPIO sensor reading" },
        ],
        defaultPaths: [
            { id: nanoid(), value: "High" },
            { id: nanoid(), value: "Low" },
            { id: nanoid(), value: "Rising Edge" },
            { id: nanoid(), value: "Falling Edge" },
        ],
    },
];

const NODE_TYPE = BuilderNode.CONDITIONAL_PATH;

export interface ConditionalPathNodeData extends BaseNodeData {
    categoryId: string | null;
    condition: {
        id: string;
        condition: string;
    } | null;
    thresholdValue?: number;
    thresholdUnit?: string;
    paths: { id: string; value: string }[];
}

type ConditionalPathNodeProps = NodeProps<Node<ConditionalPathNodeData, typeof NODE_TYPE>>;

// NodePath Component
function NodePath({ id, onRemove, isConnectable, path }: { id: string; path: { value: string }; onRemove: (id: string) => void; isConnectable: boolean }) {
    return (
        <div className="relative h-10 flex items-center gap-x-2 px-4 -mx-4 group transition-all duration-300">
            <div className="flex shrink-0 items-center gap-x-0.5">
                <button
                    type="button"
                    className="size-8 flex items-center justify-center border border-dark-50 rounded-md bg-transparent text-red-400 outline-none
                             transition-all duration-200 active:(border-dark-200 bg-dark-400/50 scale-95) hover:(bg-dark-100 rotate-6)"
                    onClick={() => onRemove(id)}
                >
                    <div className="i-mynaui:trash size-4" />
                </button>
            </div>

            <input
                type="text"
                value={path.value}
                readOnly
                className="h-8 w-full border border-dark-50 rounded-md bg-dark-400 px-2.5 text-sm font-medium shadow-sm outline-none
                         transition-all duration-300 hover:(bg-dark-300/60) read-only:(hover:bg-dark-300/30)
                         group-hover:(border-purple-500/30 shadow-[0_0_5px_rgba(124,58,237,0.1)])"
            />

            <CustomHandle
                type="source"
                id={id}
                position={Position.Right}
                isConnectable={isConnectable}
                className="top-5! transition-all duration-300 hover:(important:ring-2 important:ring-purple-500/50 important:scale-110)"
            />
        </div>
    );
}

// Category Selector Component
function CategorySelector({ selectedCategoryId, onSelectCategory }: { selectedCategoryId: string | null; onSelectCategory: (categoryId: string) => void }) {
    const selectedCategory = useMemo(() => {
        return conditionCategories.find((category) => category.id === selectedCategoryId);
    }, [selectedCategoryId]);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="h-8 w-full flex items-center justify-between border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50) data-[state=open]:(border-dark-200 bg-dark-500) data-[state=closed]:(hover:bg-dark-300)"
                >
                    <div className="flex items-center">
                        {selectedCategory ? (
                            <>
                                <div className={`${selectedCategory.icon} mr-1.5 size-4 ${selectedCategory.color}`} />
                                <div className="text-sm font-medium leading-none tracking-wide">{selectedCategory.name}</div>
                            </>
                        ) : (
                            <>
                                <div className="i-mdi:raspberry-pi mr-1.5 size-4 text-red-400" />
                                <div className="text-sm font-medium leading-none tracking-wide">Select Category</div>
                            </>
                        )}
                    </div>

                    <div className="i-lucide:chevrons-up-down ml-1 size-3 op-50" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="center"
                    sideOffset={5}
                    className={cn(
                        "w-[var(--radix-dropdown-trigger-width)] select-none border border-dark-100 rounded-lg bg-dark-200/90 p-0.5 text-light-50 shadow-xl backdrop-blur-lg transition",
                        "animate-in data-[side=top]:slide-in-bottom-0.5 data-[side=bottom]:slide-in-bottom--0.5 data-[side=bottom]:fade-in-40 data-[side=top]:fade-in-40",
                    )}
                >
                    {conditionCategories.map((category) => (
                        <DropdownMenu.Item
                            key={category.id}
                            className="h-8 flex cursor-pointer items-center border border-transparent rounded-lg px-2 outline-none transition active:(border-dark-100 bg-dark-300) hover:bg-dark-100"
                            onSelect={() => onSelectCategory(category.id)}
                        >
                            <div className="flex items-center gap-x-2">
                                <div className={`${category.icon} size-4 ${category.color}`} />
                                <div className="text-sm font-medium leading-none tracking-wide">{category.name}</div>
                            </div>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

// Condition Selector Component
function ConditionSelector({
    selectedCategoryId,
    selectedConditionId,
    onSelectCondition,
}: {
    selectedCategoryId: string | null;
    selectedConditionId: string | null;
    onSelectCondition: (condition: { id: string; condition: string }, category: (typeof conditionCategories)[0]) => void;
}) {
    const selectedCategory = useMemo(() => {
        return conditionCategories.find((category) => category.id === selectedCategoryId);
    }, [selectedCategoryId]);

    const selectedCondition = useMemo(() => {
        if (!selectedCategory || !selectedConditionId) return null;
        return selectedCategory.conditions.find((condition) => condition.id === selectedConditionId);
    }, [selectedCategory, selectedConditionId]);

    // If no category is selected, don't render the dropdown
    if (!selectedCategory) {
        return (
            <button disabled type="button" className="h-8 w-full flex items-center justify-between border border-dark-50 rounded-md bg-dark-300/50 px-2.5 outline-none cursor-not-allowed opacity-60">
                <div className="flex items-center">
                    <div className="i-lucide:git-branch mr-1.5 size-4 text-light-900/30" />
                    <div className="text-sm font-medium leading-none tracking-wide text-light-900/50">Select Category First</div>
                </div>
            </button>
        );
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="h-8 w-full flex items-center justify-between border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50) data-[state=open]:(border-dark-200 bg-dark-500) data-[state=closed]:(hover:bg-dark-300)"
                >
                    <div className="flex items-center">
                        {selectedCondition ? (
                            <>
                                <div className={`${selectedCategory.icon} mr-1.5 size-4 ${selectedCategory.color}`} />
                                <div className="text-sm font-medium leading-none tracking-wide">{selectedCondition.condition}</div>
                            </>
                        ) : (
                            <>
                                <div className={`${selectedCategory.icon} mr-1.5 size-4 ${selectedCategory.color}`} />
                                <div className="text-sm font-medium leading-none tracking-wide">Select Condition</div>
                            </>
                        )}
                    </div>

                    <div className="i-lucide:chevrons-up-down ml-1 size-3 op-50" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="center"
                    sideOffset={5}
                    className={cn(
                        "w-[var(--radix-dropdown-trigger-width)] select-none border border-dark-100 rounded-lg bg-dark-200/90 p-0.5 text-light-50 shadow-xl backdrop-blur-lg transition",
                        "animate-in data-[side=top]:slide-in-bottom-0.5 data-[side=bottom]:slide-in-bottom--0.5 data-[side=bottom]:fade-in-40 data-[side=top]:fade-in-40",
                    )}
                >
                    {selectedCategory.conditions.map((condition) => (
                        <DropdownMenu.Item
                            key={condition.id}
                            className="h-8 flex cursor-pointer items-center border border-transparent rounded-lg p-1.5 pr-6 outline-none transition active:(border-dark-100 bg-dark-300) hover:bg-dark-100"
                            onSelect={() => onSelectCondition(condition, selectedCategory)}
                        >
                            <div className="text-xs font-medium leading-none tracking-wide">{condition.condition}</div>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

export function ConditionalPathNode({ id, isConnectable, selected, data }: ConditionalPathNodeProps) {
    const [sourceHandleId] = useState<string>(nanoid());
    const [animatingCondition, setAnimatingCondition] = useState<string | null>(null);

    const { setNodes, setEdges } = useReactFlow();
    const deleteNode = useDeleteNode();

    // Clear animation states after delays
    useEffect(() => {
        if (animatingCondition !== null) {
            const timer = setTimeout(() => {
                setAnimatingCondition(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [animatingCondition]);

    // Handler to update category and automatically set paths
    const onCategoryChange = useCallback(
        (categoryId: string) => {
            setAnimatingCondition(categoryId);

            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        node.data.categoryId = categoryId;
                    }
                }),
            );
        },
        [id, setNodes],
    );

    // Handler for condition selection
    const onConditionChange = useCallback(
        (condition: { id: string; condition: string }, category: (typeof conditionCategories)[0]) => {
            setAnimatingCondition(condition.id);

            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        node.data.condition = condition;

                        // Auto-populate paths based on the directly provided category
                        if (category) {
                            // Clear existing paths
                            node.data.paths = [];

                            // Add default paths for this category
                            category.defaultPaths.forEach((path) => {
                                (node.data.paths as ConditionalPathNodeData["paths"]).push({
                                    id: nanoid(),
                                    value: path.value,
                                });
                            });

                            // Set appropriate threshold units
                            if (category.id === "cpu") {
                                node.data.thresholdUnit = "°C";
                            } else if (category.id === "memory" || category.id === "storage") {
                                node.data.thresholdUnit = "%";
                            } else {
                                node.data.thresholdUnit = "";
                            }
                        }
                    }
                }),
            );
        },
        [id, setNodes],
    );

    const onThresholdChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseFloat(e.target.value);
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) node.data.thresholdValue = isNaN(value) ? undefined : value;
                }),
            );
        },
        [id, setNodes],
    );

    const addNodePath = useCallback(
        (pathValue: string) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data.paths as ConditionalPathNodeData["paths"]).push({
                            id: nanoid(),
                            value: pathValue,
                        });
                    }
                }),
            );
        },
        [id, setNodes],
    );

    const removeNodePath = useCallback(
        (pathId: string) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        const paths = node.data.paths as ConditionalPathNodeData["paths"];
                        const pathIndex = paths.findIndex((p) => p.id === pathId);
                        paths.splice(pathIndex, 1);
                    }
                }),
            );
            setEdges((edges) => edges.filter((edge) => edge.sourceHandle !== pathId));
        },
        [id, setEdges, setNodes],
    );

    // Determine if we need a threshold value input based on category
    const showThresholdInput = useMemo(() => {
        if (!data.categoryId) return false;
        return ["cpu", "memory", "storage"].includes(data.categoryId);
    }, [data.categoryId]);

    // Get the selected category
    const selectedCategory = useMemo(() => {
        return conditionCategories.find((category) => category.id === data.categoryId);
    }, [data.categoryId]);

    return (
        <div
            data-selected={selected}
            className="w-xs border border-dark-200 rounded-xl bg-dark-300/90 shadow-sm transition-all duration-300 divide-y divide-dark-200
                     data-[selected=true]:(border-purple-600 ring-1 ring-purple-600/50 shadow-[0_0_12px_rgba(124,58,237,0.15)])"
        >
            <div className="relative overflow-clip rounded-t-xl bg-dark-300">
                <div className="absolute inset-0">
                    <div className="absolute h-full w-3/5 from-purple-800/20 to-transparent bg-gradient-to-r" />
                </div>

                <div className="relative h-9 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
                    <div className="flex grow items-center pl-0.5">
                        <div className="size-7 flex items-center justify-center">
                            <div className="size-6 flex items-center justify-center rounded-lg">
                                <div className="i-mynaui:git-branch size-4 text-purple-500 transition-transform duration-300" />
                            </div>
                        </div>

                        <div className="ml-1 text-xs font-medium leading-none tracking-wide uppercase op-80">
                            <span className="translate-y-px">Condition Path</span>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
                        <button
                            type="button"
                            className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none
                                     transition-all duration-200 active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100 rotate-12)"
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
                        <div className="text-xs text-light-900/50 font-medium">Pi Condition Category</div>

                        <div className="mt-2 flex">
                            <CategorySelector selectedCategoryId={data.categoryId} onSelectCategory={onCategoryChange} />
                        </div>

                        <div className="mt-3">
                            <div className="text-xs text-light-900/50 font-medium mb-1.5">Select Condition</div>
                            <ConditionSelector selectedCategoryId={data.categoryId} selectedConditionId={data.condition?.id || null} onSelectCondition={onConditionChange} />
                        </div>

                        {data.condition && (
                            <div className="mt-3">
                                <div className="text-xs text-light-900/50 font-medium mb-1.5">Selected Condition</div>
                                <div
                                    className={cn(
                                        "px-3 py-2 border border-dark-50 rounded-md bg-dark-400 text-sm transition-all duration-300",
                                        animatingCondition === data.condition.id && "border-purple-500/50 shadow-[0_0_8px_rgba(124,58,237,0.25)]",
                                    )}
                                >
                                    {selectedCategory && (
                                        <span className={`${selectedCategory.icon} mr-1.5 ${selectedCategory.color} ${animatingCondition === data.condition.id ? "animate-pulse" : ""}`} />
                                    )}
                                    {data.condition.condition}
                                </div>
                            </div>
                        )}

                        {showThresholdInput && (
                            <div className="mt-3">
                                <div className="text-xs text-light-900/50 font-medium mb-1.5">Threshold Value</div>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        value={data.thresholdValue ?? ""}
                                        onChange={onThresholdChange}
                                        className="h-8 w-full border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition-all duration-200 text-sm
                                                active:(border-dark-200 bg-dark-400/50) hover:bg-dark-300 focus:(border-purple-500/50 shadow-[0_0_5px_rgba(124,58,237,0.15)])"
                                        placeholder={data.categoryId === "cpu" ? "e.g. 70" : "e.g. 80"}
                                    />
                                    {data.thresholdUnit && <span className="ml-2 text-xs text-light-900/50">{data.thresholdUnit}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <CustomHandle
                        type="target"
                        id={sourceHandleId}
                        position={Position.Left}
                        isConnectable={isConnectable}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-purple-500/50 important:scale-110)"
                    />
                </div>

                <div className="flex flex-col p-4">
                    <div className="text-xs text-light-900/50 font-medium">Condition Paths</div>

                    {data.paths.length > 0 && (
                        <div className="mt-2 flex flex-col gap-2">
                            {data.paths.map((path) => (
                                <NodePath key={path.id} id={path.id} path={path} onRemove={removeNodePath} isConnectable={isConnectable} />
                            ))}
                        </div>
                    )}

                    {data.categoryId && (
                        <div className="mt-2 flex">
                            <button
                                type="button"
                                className="h-8 w-full flex items-center justify-between border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none
                                         transition-all duration-200 active:(border-dark-200 bg-dark-400/50 scale-95)
                                         hover:(bg-dark-100 shadow-[0_0_5px_rgba(124,58,237,0.15)])"
                                onClick={() => addNodePath("Custom Path")}
                            >
                                <div className="flex items-center">
                                    <div className="i-lucide:git-fork size-3.5 mr-1.5 text-purple-400" />
                                    <div className="text-xs font-medium leading-none tracking-wide">Add Custom Path</div>
                                </div>
                                <div className="i-lucide:plus ml-1 size-3.5 text-white op-50 group-hover:rotate-90 transition-transform duration-200" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-4 py-2">
                    <div className="text-xs text-light-900/50">Routes flow based on Raspberry Pi metrics and conditions.</div>
                </div>

                <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
                    Node: <span className="text-light-900/60 font-semibold">#{id}</span>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<ConditionalPathNodeData> = {
    type: NODE_TYPE,
    node: memo(ConditionalPathNode),
    detail: {
        icon: "i-mynaui:git-branch",
        title: "Condition Path",
        description: "Check Raspberry Pi metrics and take different paths based on conditions.",
    },
    defaultData: {
        categoryId: null,
        condition: null,
        thresholdValue: undefined,
        thresholdUnit: "",
        paths: [],
    },
};
