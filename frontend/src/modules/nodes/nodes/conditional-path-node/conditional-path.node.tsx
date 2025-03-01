import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { ConditionDropdownSelector } from "~/modules/nodes/nodes/conditional-path-node/components/condition-dropdown-selector";
import { NodePath } from "~/modules/nodes/nodes/conditional-path-node/components/node-path";
import { type BaseNodeData, BuilderNode, type RegisterNodeMetadata } from "~/modules/nodes/types";

import { cn } from "~@/utils/cn";

const caseList = [
    { id: nanoid(), value: "Above Threshold" },
    { id: nanoid(), value: "Below Threshold" },
    { id: nanoid(), value: "Equal To" },
    { id: nanoid(), value: "State Changed" },
    { id: nanoid(), value: "Is Active" },
    { id: nanoid(), value: "Is Inactive" },
    { id: nanoid(), value: "Connected" },
    { id: nanoid(), value: "Disconnected" },
    { id: nanoid(), value: "Critical" },
    { id: nanoid(), value: "Warning" },
    { id: nanoid(), value: "Stable" },
    { id: nanoid(), value: "Default" },
];

const NODE_TYPE = BuilderNode.CONDITIONAL_PATH;

export interface ConditionalPathNodeData extends BaseNodeData {
    condition: {
        id: string;
        condition: string;
    } | null;
    thresholdValue?: number;
    paths: { id: string; case: { id: string; value: string } }[];
}

type ConditionalPathNodeProps = NodeProps<Node<ConditionalPathNodeData, typeof NODE_TYPE>>;

export function ConditionalPathNode({ id, isConnectable, selected, data }: ConditionalPathNodeProps) {
    const [sourceHandleId] = useState<string>(nanoid());

    const { setNodes, setEdges } = useReactFlow();
    const deleteNode = useDeleteNode();

    const onConditionChange = useCallback(
        (value: { id: string; condition: string } | null) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);

                    if (node) node.data.condition = value;
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

    const filteredCaseList = useMemo<Omit<ConditionalPathNodeData["paths"][number], "id">["case"][]>(() => {
        return caseList.filter((c) => !data.paths.some((p) => p.case.value === c.value));
    }, [data.paths]);

    const addNodePath = useCallback(
        (path: { id: string; value: string }) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);

                    if (node) {
                        (node.data.paths as ConditionalPathNodeData["paths"]).push({
                            id: nanoid(),
                            case: path,
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

    // Determine if we need a threshold value input based on condition
    const showThresholdInput = useMemo(() => {
        if (!data.condition) return false;
        return (
            data.condition.condition.includes("threshold") || data.condition.condition.includes("above") || data.condition.condition.includes("below") || data.condition.condition.includes("exceeds")
        );
    }, [data.condition]);

    return (
        <div
            data-selected={selected}
            className="w-xs border border-dark-200 rounded-xl bg-dark-300/50 shadow-sm backdrop-blur-xl transition divide-y divide-dark-200 data-[selected=true]:(border-purple-600 ring-1 ring-purple-600/50)"
        >
            <div className="relative overflow-clip rounded-t-xl bg-dark-300/50">
                <div className="absolute inset-0">
                    <div className="absolute h-full w-3/5 from-purple-800/20 to-transparent bg-gradient-to-r" />
                </div>

                <div className="relative h-9 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
                    <div className="flex grow items-center pl-0.5">
                        <div className="size-7 flex items-center justify-center">
                            <div className="size-6 flex items-center justify-center rounded-lg">
                                <div className="i-mynaui:git-branch size-4 text-purple-500" />
                            </div>
                        </div>

                        <div className="ml-1 text-xs font-medium leading-none tracking-wide uppercase op-80">
                            <span className="translate-y-px">Pi Condition Path</span>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
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
                <div className="relative min-h-10 flex flex-col">
                    <div className="flex flex-col p-4">
                        <div className="text-xs text-light-900/50 font-medium">Pi Condition</div>

                        <div className="mt-2 flex">
                            <ConditionDropdownSelector value={data.condition} onChange={onConditionChange} />
                        </div>

                        {showThresholdInput && (
                            <div className="mt-3">
                                <div className="text-xs text-light-900/50 font-medium mb-1.5">Threshold Value</div>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        value={data.thresholdValue ?? ""}
                                        onChange={onThresholdChange}
                                        className="h-8 w-full border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition text-sm
                                                 active:(border-dark-200 bg-dark-400/50) hover:bg-dark-300"
                                        placeholder={data.condition?.condition.includes("CPU") ? "e.g. 70°C" : data.condition?.condition.includes("Memory") ? "e.g. 80%" : "Value"}
                                    />
                                    {data.condition?.condition.includes("CPU") && <span className="ml-2 text-xs text-light-900/50">°C</span>}
                                    {data.condition?.condition.includes("Memory") && <span className="ml-2 text-xs text-light-900/50">%</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <CustomHandle type="target" id={sourceHandleId} position={Position.Left} isConnectable={isConnectable} className="top-6! hover:(important:ring-2 important:ring-purple-500/50)" />
                </div>

                <div className="flex flex-col p-4">
                    <div className="text-xs text-light-900/50 font-medium">Condition Paths</div>

                    {data.paths.length > 0 && (
                        <div className="mt-2 flex flex-col">
                            {data.paths.map((path) => (
                                <NodePath key={path.id} id={path.id} path={path.case} onRemove={(_id) => removeNodePath(_id)} isConnectable={isConnectable} />
                            ))}
                        </div>
                    )}

                    {filteredCaseList.length > 0 && (
                        <div className="mt-2 flex">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button
                                        type="button"
                                        className="h-8 w-full flex items-center justify-between border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50)"
                                    >
                                        <div className="flex items-center">
                                            <div className="i-lucide:git-fork size-3.5 mr-1.5 text-purple-400" />
                                            <div className="text-xs font-medium leading-none tracking-wide">Add Path</div>
                                        </div>

                                        <div className="i-lucide:plus ml-1 size-3.5 text-white op-50" />
                                    </button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content
                                        sideOffset={5}
                                        className={cn(
                                            "min-w-40 select-none border border-dark-100 rounded-lg bg-dark-200/90 p-0.5 text-light-50 shadow-xl backdrop-blur-lg transition",
                                            "animate-in data-[side=top]:slide-in-bottom-0.5 data-[side=bottom]:slide-in-bottom--0.5 data-[side=bottom]:fade-in-40 data-[side=top]:fade-in-40",
                                        )}
                                    >
                                        {filteredCaseList.map((path) => (
                                            <DropdownMenu.Item
                                                key={path.id}
                                                className="h-8 flex cursor-pointer items-center border border-transparent rounded-lg p-1.5 pr-6 outline-none transition active:(border-dark-100 bg-dark-300) hover:bg-dark-100"
                                                onSelect={() => addNodePath({ id: path.id, value: path.value })}
                                            >
                                                <div className="flex items-center gap-x-2">
                                                    {path.value === "Above Threshold" && <div className="i-mdi:arrow-up size-3.5 text-red-400" />}
                                                    {path.value === "Below Threshold" && <div className="i-mdi:arrow-down size-3.5 text-green-400" />}
                                                    {path.value === "Equal To" && <div className="i-mdi:equal size-3.5 text-blue-400" />}
                                                    {path.value === "State Changed" && <div className="i-mdi:state-machine size-3.5 text-yellow-400" />}
                                                    {path.value === "Is Active" && <div className="i-mdi:check-circle size-3.5 text-green-400" />}
                                                    {path.value === "Is Inactive" && <div className="i-mdi:close-circle size-3.5 text-red-400" />}
                                                    {path.value === "Connected" && <div className="i-mdi:lan-connect size-3.5 text-green-400" />}
                                                    {path.value === "Disconnected" && <div className="i-mdi:lan-disconnect size-3.5 text-red-400" />}
                                                    {path.value === "Critical" && <div className="i-mdi:alert-circle size-3.5 text-red-400" />}
                                                    {path.value === "Warning" && <div className="i-mdi:alert size-3.5 text-yellow-400" />}
                                                    {path.value === "Stable" && <div className="i-mdi:shield-check size-3.5 text-green-400" />}
                                                    {path.value === "Default" && <div className="i-mdi:arrow-right size-3.5 text-gray-400" />}
                                                    <div className="text-xs font-medium leading-none tracking-wide">{path.value}</div>
                                                </div>
                                            </DropdownMenu.Item>
                                        ))}
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
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
        condition: null,
        thresholdValue: undefined,
        paths: [],
    },
};
