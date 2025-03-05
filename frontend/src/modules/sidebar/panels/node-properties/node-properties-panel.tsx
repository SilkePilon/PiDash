import { useNodes, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import SplitPane, { Pane } from "split-pane-react";

import { ExecutionExplorerPanel } from "~/modules/flow-builder/components/execution-explorer/execution-explorer-panel";
import { BuilderNode } from "~/modules/nodes/types";
import SidebarPanelHeading from "~/modules/sidebar/components/sidebar-panel-heading";
import SidebarPanelWrapper from "~/modules/sidebar/components/sidebar-panel-wrapper";
import { NodeListItem } from "~/modules/sidebar/panels/node-properties/components/node-list-item";
import { NodePropertyPanel } from "~/modules/sidebar/panels/node-properties/components/node-propery-panel";
import { useNodeList } from "~/modules/sidebar/panels/node-properties/hooks/use-node-list";
import IntroductionPropertyPanel from "~/modules/sidebar/panels/node-properties/property-panels/introduction-property-panel";
import { useApplicationState } from "~/stores/application-state";
import { trackSomethingInNodeProperties } from "~/utils/ga4";
import { defaultOverlayScrollbarsOptions } from "~/utils/overlayscrollbars";

export function NodePropertiesPanel() {
    const { paneSizes, selectedNode, setPaneSizes, setSelectedNode } = useApplicationState(s => ({
        paneSizes: s.sidebar.panels.nodeProperties.paneSizes,
        setPaneSizes: s.actions.sidebar.panels.nodeProperties.setPaneSizes,
        selectedNode: s.sidebar.panels.nodeProperties.selectedNode,
        setSelectedNode: s.actions.sidebar.panels.nodeProperties.setSelectedNode,
    }));

    const [detailsPaneSizes, setDetailsPaneSizes] = useState<number[]>([100, 0]);
    
    const nodes = useNodes();

    const nodeList = useNodeList(nodes);

    const { setNodes } = useReactFlow();

    const onNodeClick = (id: string) => {
        setNodes(nds => produce(nds, (draft) => {
            draft.forEach((node) => {
                node.selected = node.id === id;
            });
        }));

        setSelectedNode({ id, type: nodeList.find(n => n.id === id)?.type as BuilderNode });
    };

    const selectedNodeData = useMemo(() => {
        return nodes.find(n => n.id === selectedNode?.id)?.data;
    }, [nodes, selectedNode?.id]);

    // Check if selected node has execution data to show the execution panel
    const hasExecutionData = useMemo(() => {
        if (!selectedNode) return false;
        const node = nodes.find(n => n.id === selectedNode.id);
        return node && (node.data.executing || node.data.executionStatus || node.data.executionResult);
    }, [nodes, selectedNode]);

    // Update detail pane sizes based on execution data
    useMemo(() => {
        setDetailsPaneSizes(hasExecutionData ? [60, 40] : [100, 0]);
    }, [hasExecutionData]);

    // Render execution details or empty div
    const executionDetailsContent = hasExecutionData ? (
        <div className="h-full flex flex-col">
            <SidebarPanelHeading className="shrink-0">
                <div className="i-mdi:chart-timeline size-4.5" />
                Execution Details
            </SidebarPanelHeading>

            <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
                <ExecutionExplorerPanel />
            </OverlayScrollbarsComponent>
        </div>
    ) : <div className="empty-placeholder"></div>;

    return (
        <SidebarPanelWrapper>
            <SplitPane
                sizes={paneSizes}
                sashRender={(): ReactElement => <div className="bg-dark-300) <md:hover(scale-y-100 h-0.5 bg-dark-300 transition hover:(scale-y-200 bg-teal-800/50)" />}
                onChange={setPaneSizes}
                split="horizontal"
            >
                <Pane minSize={150}>
                    <div className="h-full flex flex-col">
                        <SidebarPanelHeading className="shrink-0">
                            <div className="i-mynaui:layers-three size-4.5" />
                            Nodes in Flow
                        </SidebarPanelHeading>

                        <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
                            <div className="flex flex-col gap-1 p-1.5">
                                {nodeList.map(node => (
                                    <NodeListItem
                                        key={node.id}
                                        id={node.type === BuilderNode.START || node.type === BuilderNode.END ? undefined : node.id}
                                        title={node.detail.title}
                                        icon={`${node.detail.icon} ${node.type === BuilderNode.START || node.type === BuilderNode.END ? "scale-135" : ""}`}
                                        selected={selectedNode?.id === node.id}
                                        pseudoSelected={node.selected}
                                        onClick={() => {
                                            trackSomethingInNodeProperties("view-node-properties");
                                            onNodeClick(node.id);
                                        }}
                                    />
                                ))}
                            </div>
                        </OverlayScrollbarsComponent>
                    </div>
                </Pane>

                <Pane>
                    <div className="h-full">
                        <SplitPane 
                            split="horizontal" 
                            sizes={detailsPaneSizes}
                            onChange={setDetailsPaneSizes}
                            sashRender={(): ReactElement => <div className="bg-dark-300) <md:hover(scale-y-100 h-0.5 bg-dark-300 transition hover:(scale-y-200 bg-teal-800/50)" />}
                        >
                            <Pane minSize={200}>
                                <div className="h-full flex flex-col">
                                    <SidebarPanelHeading className="shrink-0">
                                        <div className="i-mynaui:cog size-4.5" />
                                        Properties
                                    </SidebarPanelHeading>

                                    <OverlayScrollbarsComponent className="grow" defer options={defaultOverlayScrollbarsOptions}>
                                        {selectedNode 
                                            ? <NodePropertyPanel id={selectedNode.id} type={selectedNode.type} data={selectedNodeData} />
                                            : <IntroductionPropertyPanel />}
                                    </OverlayScrollbarsComponent>
                                </div>
                            </Pane>

                            <Pane minSize={hasExecutionData ? 100 : 0}>
                                {executionDetailsContent}
                            </Pane>
                        </SplitPane>
                    </div>
                </Pane>
            </SplitPane>
        </SidebarPanelWrapper>
    );
}
