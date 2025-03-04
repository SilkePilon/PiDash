import { type Node, type NodeProps, Position } from "@xyflow/react";
import { nanoid } from "nanoid";
import { memo, useMemo, useState } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { NodeExecutionStatus } from "~/modules/nodes/components/node-execution-status";
import { type BaseNodeData, BuilderNode, NodeCategory, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";

import { cn } from "~@/utils/cn";

export interface StartNodeData extends BaseNodeData {
    label?: string;
}

const NODE_TYPE = BuilderNode.START;

type StartNodeProps = NodeProps<Node<StartNodeData, typeof NODE_TYPE>>;

export function StartNode({ data, selected, isConnectable }: StartNodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);

    const [sourceHandleId] = useState<string>(nanoid());
    
    // Determine if the node has execution data
    const hasExecutionData = data.executing || data.executionStatus;

    return (
        <>
            <div
                data-selected={selected}
                className={cn(
                    "relative flex items-center border border-dark-100 rounded-full bg-dark-300 px-4 py-2 shadow-sm transition",
                    "data-[selected=true]:(border-teal-600 ring-1 ring-teal-600/50)",
                    // Add visual indicator for execution state
                    data.executing && "animate-pulse border-yellow-500/50",
                    data.executionStatus === "success" && "border-green-500/50",
                    data.executionStatus === "error" && "border-red-500/50"
                )}
            >
                <div className={cn(
                    meta.icon, 
                    "size-4.5 shrink-0 mr-2 scale-130",
                    // Animate icon during execution
                    data.executing && "animate-bounce text-yellow-500"
                )} />

                <span className="mr-1">
                    {data.label || meta.title}
                </span>
                
                {/* Add execution result message if available */}
                {data.executionResult?.message && (
                    <div className={cn(
                        "absolute top-full mt-1 text-xs px-2 py-1 rounded-md whitespace-nowrap",
                        data.executionStatus === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {data.executionResult.message}
                    </div>
                )}
                
                {/* Add the execution status indicator */}
                {hasExecutionData && (
                    <NodeExecutionStatus 
                        executing={data.executing}
                        executionStatus={data.executionStatus}
                        className="top-0 right-0 translate-x-1/3 -translate-y-1/3"
                    />
                )}
            </div>

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
export const metadata: RegisterNodeMetadata<StartNodeData> = {
    type: NODE_TYPE,
    node: memo(StartNode),
    detail: {
        icon: "i-mynaui:play",
        title: "Start",
        description: "Starting point of the flow.",
        category: NodeCategory.BASIC
    },
    defaultData: {
        label: "",
    },
};
