import { useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { useCallback } from "react";
import type { BuilderNodeType } from "~/modules/nodes/types";
import { NODE_PROPERTY_PANEL_COMPONENTS } from "~/modules/sidebar/panels/node-properties/constants/property-panels";
import UnavailableNodePropertyPanel from "~/modules/sidebar/panels/node-properties/property-panels/unavailable-property-panel";
import { trackSomethingInNodeProperties } from "~/utils/ga4";
import type { ReactElement } from "react";

export interface NodeData {
  [key: string]: unknown;
}

type NodePropertyPanelProps = Readonly<{
  id: string;
  type: BuilderNodeType;
  data: NodeData | undefined;
}>;

export function NodePropertyPanel({ id, type, data }: NodePropertyPanelProps): ReactElement {
    const PanelComponent = NODE_PROPERTY_PANEL_COMPONENTS[type];
    const { setNodes } = useReactFlow();
    const nodeData = data ? produce(data, () => {}) : undefined;

    const updateData = useCallback((newData: Partial<NodeData>) => {
        setNodes(nds => produce(nds, (draft) => {
            const node = draft.find(n => n.id === id);
            if (node)
                node.data = { ...node.data, ...newData };
        }));

        trackSomethingInNodeProperties(`update-node-properties-of-${type}`);
    }, [id, setNodes, type]);

    if (!PanelComponent || !nodeData) {
        return <UnavailableNodePropertyPanel />;
    }

    return <PanelComponent id={id} type={type} data={nodeData} updateData={updateData} />;
}
