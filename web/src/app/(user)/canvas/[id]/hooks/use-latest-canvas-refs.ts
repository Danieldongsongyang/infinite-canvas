import { useLayoutEffect, useRef } from "react";

import type { PendingConnectionCreate } from "../canvas-page-types";
import type { CanvasConnection, CanvasNodeData, CanvasNodeGroup, ConnectionHandle, SelectionBox, ViewportTransform } from "../../types";

type UseLatestCanvasRefsParams = {
    nodes: CanvasNodeData[];
    connections: CanvasConnection[];
    groups: CanvasNodeGroup[];
    selectedNodeIds: Set<string>;
    viewport: ViewportTransform;
    connectingParams: ConnectionHandle | null;
    connectionTargetNodeId: string | null;
    selectionBox: SelectionBox | null;
    pendingConnectionCreate: PendingConnectionCreate | null;
};

export function useLatestCanvasRefs({ nodes, connections, groups, selectedNodeIds, viewport, connectingParams, connectionTargetNodeId, selectionBox, pendingConnectionCreate }: UseLatestCanvasRefsParams) {
    const nodesRef = useRef(nodes);
    const connectionsRef = useRef(connections);
    const groupsRef = useRef(groups);
    const selectedNodeIdsRef = useRef(selectedNodeIds);
    const viewportRef = useRef(viewport);
    const connectingParamsRef = useRef(connectingParams);
    const connectionTargetNodeIdRef = useRef(connectionTargetNodeId);
    const selectionBoxRef = useRef(selectionBox);
    const pendingConnectionCreateRef = useRef(pendingConnectionCreate);

    useLayoutEffect(() => {
        nodesRef.current = nodes;
        connectionsRef.current = connections;
        groupsRef.current = groups;
        selectedNodeIdsRef.current = selectedNodeIds;
        viewportRef.current = viewport;
        connectingParamsRef.current = connectingParams;
        connectionTargetNodeIdRef.current = connectionTargetNodeId;
        pendingConnectionCreateRef.current = pendingConnectionCreate;
    }, [nodes, connections, groups, selectedNodeIds, viewport, connectingParams, connectionTargetNodeId, pendingConnectionCreate]);

    useLayoutEffect(() => {
        selectionBoxRef.current = selectionBox;
    }, [selectionBox]);

    return {
        nodesRef,
        connectionsRef,
        groupsRef,
        selectedNodeIdsRef,
        viewportRef,
        connectingParamsRef,
        connectionTargetNodeIdRef,
        selectionBoxRef,
        pendingConnectionCreateRef,
    };
}
