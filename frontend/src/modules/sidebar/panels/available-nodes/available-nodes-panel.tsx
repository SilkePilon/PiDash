import { useInsertNode } from "~/modules/flow-builder/hooks/use-insert-node";
import { AVAILABLE_NODES } from "~/modules/nodes";
import { NODE_CATEGORIES } from "~/modules/nodes/constants/categories";
import { NodeCategory } from "~/modules/nodes/types";
import SidebarPanelWrapper from "~/modules/sidebar/components/sidebar-panel-wrapper";
import { NodePreviewDraggable } from "~/modules/sidebar/panels/available-nodes/components/node-preview-draggable";
import { useApplicationState } from "~/stores/application-state";
import { cn } from "~@/utils/cn";
import { useState } from "react";

export default function AvailableNodesPanel() {
    const { isMobileView, setActivePanel } = useApplicationState(s => ({
        isMobileView: s.view.mobile,
        setActivePanel: s.actions.sidebar.setActivePanel,
    }));
    const insertNode = useInsertNode();
    const [searchTerm, setSearchTerm] = useState("");
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // Group nodes by category
    const nodesByCategory = AVAILABLE_NODES.reduce((acc, node) => {
        const category = node.category || NodeCategory.BASIC;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(node);
        return acc;
    }, {} as Record<NodeCategory, typeof AVAILABLE_NODES>);

    const toggleCategory = (categoryId: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const filterNodes = (nodes: typeof AVAILABLE_NODES) => {
        if (!searchTerm) return nodes;
        return nodes.filter(node => 
            node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    return (
        <SidebarPanelWrapper>
            <div className="mt-4 flex flex-col items-center p-4 text-center">
                <div className="size-12 flex items-center justify-center rounded-full bg-teal-800">
                    <div className="i-mynaui:grid size-6 text-white" />
                </div>

                <div className="mt-4 text-balance font-medium">Available Nodes</div>

                <div className="mt-1 w-2/3 text-xs text-light-50/40 font-medium leading-normal">
                    {isMobileView ? "Tap on a node to add it to your flow" : "Drag and drop nodes to build your flow"}
                </div>
            </div>

            <div className="px-4 mb-4">
                <input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded-lg bg-light-950 border border-light-800 text-light-50"
                />
            </div>

            <div className="flex flex-col gap-6 p-4">
                {NODE_CATEGORIES.map(category => {
                    const nodes = filterNodes(nodesByCategory[category.id] || []);
                    if (nodes.length === 0) return null;
                    const isCollapsed = collapsedCategories.has(category.id);

                    return (
                        <div key={category.id} className="flex flex-col gap-4">
                            <div 
                                className="flex items-center gap-2 px-1 cursor-pointer"
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className={cn(
                                    "i-ph:caret-right size-4 transition-transform",
                                    !isCollapsed && "rotate-90"
                                )} />
                                <div className={cn(category.icon, "size-4 text-light-900/70")} />
                                <div className="text-sm font-medium text-light-900/70">{category.name}</div>
                            </div>
                            {!isCollapsed && (
                                <div className="grid grid-cols-1 gap-4">
                                    {nodes.map(node => (
                                        <NodePreviewDraggable
                                            key={node.type}
                                            type={node.type}
                                            icon={node.icon}
                                            title={node.title}
                                            description={node.description}
                                            isMobileView={isMobileView}
                                            setActivePanel={setActivePanel}
                                            insertNode={insertNode}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </SidebarPanelWrapper>
    );
}
