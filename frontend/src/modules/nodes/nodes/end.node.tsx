import { type Node, type NodeProps, Position } from "@xyflow/react";
import { nanoid } from "nanoid";
import { memo, useMemo, useState } from "react";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { NodeExecutionStatus } from "~/modules/nodes/components/node-execution-status";
import { type BaseNodeData, BuilderNode, NodeCategory, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";

import { cn } from "~@/utils/cn";

export interface EndNodeData extends BaseNodeData {
    label?: string;
}

const NODE_TYPE = BuilderNode.END;

type EndNodeProps = NodeProps<Node<EndNodeData, typeof NODE_TYPE>>;

export function EndNode({ data, selected, isConnectable }: EndNodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);

    const [targetHandleId] = useState<string>(nanoid());
    
    // Determine if the node has execution data
    const hasExecutionData = data.executing || data.executionStatus;
    
    // Check for execution completion to display final result
    const isExecutionComplete = data.executionStatus === "success" || data.executionStatus === "error";

    return (
        <>
            <div
                data-selected={selected}
                className={cn(
                    "relative flex items-center border border-dark-100 rounded-full bg-dark-300 px-4 py-2 shadow-sm transition",
                    "data-[selected=true]:(border-red-600 ring-1 ring-red-600/50)",
                    // Add visual indicator for execution state
                    data.executing && "animate-pulse border-yellow-500/50",
                    data.executionStatus === "success" && "border-green-500/50",
                    data.executionStatus === "error" && "border-red-500/50"
                )}
            >
                <div className={cn(
                    meta.icon, 
                    "size-4.5 shrink-0 mr-2 scale-130",
                    // Change icon color based on execution state
                    data.executing && "text-yellow-500",
                    data.executionStatus === "success" && "text-green-500",
                    data.executionStatus === "error" && "text-red-500"
                )} />

                <span className="mr-1">
                    {data.label || meta.title}
                </span>
                
                {/* Show execution result when flow is complete */}
                {isExecutionComplete && data.executionResult && (
                    <div className={cn(
                        "absolute top-full mt-1 text-xs px-2 py-1 rounded-md",
                        data.executionStatus === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {data.executionResult.message || (data.executionStatus === "success" ? "Flow completed successfully" : "Flow failed")}
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
                type="target"
                id={targetHandleId}
                position={Position.Left}
                isConnectable={isConnectable}
            />
        </>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<EndNodeData> = {
    type: NODE_TYPE,
    node: memo(EndNode),
    detail: {
        icon: "i-mynaui:stop",
        title: "End",
        description: "Final node where the flow ends.",
        category: NodeCategory.BASIC
    },
    defaultData: {
        label: "",
    },
};
