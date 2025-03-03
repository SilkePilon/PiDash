import type { ComponentType } from "react";

export enum BuilderNode {
    START = "start",
    END = "end",
    TEXT_MESSAGE = "text-message",
    CONDITIONAL_PATH = "conditional-path",
    CONNECT_RASPBERRY_PI = "connect-raspberry-pi",
    RUN_COMMAND = "run-command",
    GPIO = "gpio",
    LOOP = "loop",
    RUN_JAVASCRIPT = "run-javascript",
    RUN_PYTHON = "run-python",
    GITHUB = "github",
}
export type BuilderNodeType = `${BuilderNode}`;

export enum NodeCategory {
    BASIC = "basic",
    CONTROL_FLOW = "control-flow",
    RASPBERRY_PI = "raspberry-pi",
    EXECUTION = "execution",
    INTEGRATIONS = "integrations"
}
export type NodeCategoryType = `${NodeCategory}`;

export interface NodeCategoryMetadata {
    id: NodeCategory;
    name: string;
    icon: string;
    description: string;
}

export interface RegisterNodeMetadata<T = Record<string, any>> {
    type: BuilderNodeType;
    node: ComponentType<any>;
    detail: {
        icon: string;
        title: string;
        description: string;
        category: NodeCategory; // Add category to node metadata
    };
    available?: boolean;
    defaultData?: T;
    propertyPanel?: ComponentType<any>;
}

export interface BaseNodeData extends Record<string, any> {
    deletable?: boolean;
}
