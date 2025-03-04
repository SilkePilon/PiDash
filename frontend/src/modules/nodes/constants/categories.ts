import { NodeCategory, type NodeCategoryMetadata } from "~/modules/nodes/types";

export const NODE_CATEGORIES: NodeCategoryMetadata[] = [
    {
        id: NodeCategory.BASIC,
        name: "Basic",
        icon: "i-mynaui:grid",
        description: "Basic flow control nodes like Start and End"
    },
    {
        id: NodeCategory.CONTROL_FLOW,
        name: "Control Flow",
        icon: "i-mynaui:git-branch",
        description: "Nodes for controlling flow execution like loops and conditions"
    },
    {
        id: NodeCategory.RASPBERRY_PI,
        name: "Raspberry Pi",
        icon: "i-mdi:raspberry-pi",
        description: "Nodes for interacting with Raspberry Pi devices"
    },
    {
        id: NodeCategory.EXECUTION,
        name: "Code Execution",
        icon: "i-mynaui:command",
        description: "Nodes for executing code and commands"
    },
    {
        id: NodeCategory.INTEGRATIONS,
        name: "Integrations",
        icon: "i-mynaui:connection",
        description: "Integration nodes for external services"
    }
];