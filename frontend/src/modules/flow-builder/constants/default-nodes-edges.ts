import { nanoid } from "nanoid";

import { BuilderNode } from "~/modules/nodes/types";
import { createNodeWithDefaultData } from "~/modules/nodes/utils";

// Constants for positioning to ensure perfect alignment
const HORIZONTAL_SPACING = 300;

// The Raspberry Pi node is likely taller than the start node, so we need to adjust positions
const PI_NODE_VERTICAL_POSITION = 100;
const START_NODE_VERTICAL_POSITION = 125; // Adjusted to align with the center of the Pi node
const END_NODE_VERTICAL_POSITION = 125; // Also adjust end node to match start node height

const startNode = createNodeWithDefaultData(BuilderNode.START, {
    position: { x: 0, y: START_NODE_VERTICAL_POSITION },
});

const raspberryPiNode = createNodeWithDefaultData(BuilderNode.CONNECT_RASPBERRY_PI, {
    position: { x: HORIZONTAL_SPACING, y: PI_NODE_VERTICAL_POSITION },
});

const endNode = createNodeWithDefaultData(BuilderNode.END, {
    position: { x: HORIZONTAL_SPACING * 2, y: END_NODE_VERTICAL_POSITION },
});

const nodes = [startNode, raspberryPiNode, endNode];

const edges = [
    { id: nanoid(), source: startNode.id, target: raspberryPiNode.id, type: "deletable" },
    // No edge from raspberryPiNode to endNode - user will need to connect them manually
];

export { nodes as defaultNodes, edges as defaultEdges };
