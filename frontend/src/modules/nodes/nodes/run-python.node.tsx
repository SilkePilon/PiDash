// filepath: c:\PiDash\frontend\src\modules\nodes\nodes\run-python.node.tsx
import { type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { produce } from "immer";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import AceEditor from "react-ace";
import { createPortal } from "react-dom";

// Import required mode and theme for Python syntax highlighting
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-tomorrow_night";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/keybinding-vscode";

import CustomHandle from "~/modules/flow-builder/components/handles/custom-handle";
import { useDeleteNode } from "~/modules/flow-builder/hooks/use-delete-node";
import { type BaseNodeData, BuilderNode, NodeCategory, type RegisterNodeMetadata } from "~/modules/nodes/types";
import { getNodeDetail } from "~/modules/nodes/utils";
import { cn } from "~@/utils/cn";

const NODE_TYPE = BuilderNode.RUN_PYTHON;

export interface RunPythonNodeData extends BaseNodeData {
    code: string;
    output: string;
    status: "idle" | "running" | "success" | "error";
    errorMessage?: string;
}

type RunPythonNodeProps = NodeProps<Node<RunPythonNodeData, typeof NODE_TYPE>>;

export function RunPythonNode({ id, isConnectable, selected, data }: RunPythonNodeProps) {
    const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);
    const [sourceHandleId] = useState<string>(nanoid());
    const [targetHandleId] = useState<string>(nanoid());
    const [showSuccess, setShowSuccess] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editorCode, setEditorCode] = useState(data.code);
    const [codeHistory, setCodeHistory] = useState<string[]>([data.code]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [fontSize, setFontSize] = useState(14);
    const editorRef = useRef<any>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const { setNodes } = useReactFlow();
    const deleteNode = useDeleteNode();
    const [isSaving, setIsSaving] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Clear success notification after delay
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    useEffect(() => {
        // Update editorCode when data.code changes (e.g., from initial load)
        setEditorCode(data.code);
        setCodeHistory([data.code]);
        setHistoryIndex(0);
    }, [data.code]);

    const updateCode = useCallback(
        (value: string) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    const node = draft.find((n) => n.id === id);
                    if (node) {
                        (node.data as RunPythonNodeData).code = value;
                    }
                }),
            );
        },
        [id, setNodes],
    );

    const handleEditorChange = useCallback((value: string) => {
        setEditorCode(value);
        
        // Add to history only if it's different from the last entry
        if (value !== codeHistory[historyIndex]) {
            const newHistory = codeHistory.slice(0, historyIndex + 1);
            newHistory.push(value);
            setCodeHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }, [codeHistory, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setEditorCode(codeHistory[historyIndex - 1]);
        }
    }, [historyIndex, codeHistory]);
    
    const redo = useCallback(() => {
        if (historyIndex < codeHistory.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setEditorCode(codeHistory[historyIndex + 1]);
        }
    }, [historyIndex, codeHistory]);

    const increaseFontSize = useCallback(() => {
        setFontSize((prev) => Math.min(prev + 1, 24));
    }, []);
    
    const decreaseFontSize = useCallback(() => {
        setFontSize((prev) => Math.max(prev - 1, 10));
    }, []);

    const formatCode = useCallback(() => {
        if (editorRef.current) {
            try {
                // Format with Black formatter when available - this is just a simulation
                const formatted = editorRef.current.editor.getValue();
                editorRef.current.editor.setValue(formatted, -1);
                // In a real implementation, you would use Black or another Python formatter here
            } catch (error) {
                console.error("Error formatting code:", error);
            }
        }
    }, []);

    const openEditorModal = useCallback(() => {
        setEditorCode(data.code);
        setShowEditor(true);
        // Prevent scrolling when modal is open
        document.body.style.overflow = "hidden";
    }, [data.code]);

    const closeEditorModal = useCallback(() => {
        // Don't allow closing if we're in the middle of saving
        if (isSaving) return;
        
        setIsClosing(true);
        
        // After animation completes, actually close the modal
        setTimeout(() => {
            setIsClosing(false);
            setShowEditor(false);
            // Restore scrolling when modal is closed
            document.body.style.overflow = "";
        }, 300);
    }, [isSaving]);

    const saveEditorCode = useCallback(() => {
        setIsSaving(true);
        
        // After save animation completes, start close animation
        setTimeout(() => {
            updateCode(editorCode);
            setIsSaving(false);
            setIsClosing(true);
            
            // After close animation completes, actually close the modal
            setTimeout(() => {
                setIsClosing(false);
                setShowEditor(false);
                // Restore scrolling when modal is closed
                document.body.style.overflow = "";
            }, 300); // Duration of the close animation
        }, 600); // Duration of the save animation
    }, [editorCode, updateCode]);

    const executeCode = useCallback(() => {
        setNodes((nodes) =>
            produce(nodes, (draft) => {
                const node = draft.find((n) => n.id === id);
                if (node) {
                    const nodeData = node.data as RunPythonNodeData;
                    nodeData.status = "running";
                    nodeData.output = "";
                    nodeData.errorMessage = undefined;
                    
                    // Simulate Python execution - in real implementation, this would connect to the Pi and run the Python code
                    setTimeout(() => {
                        setNodes((nodes) =>
                            produce(nodes, (draft) => {
                                const node = draft.find((n) => n.id === id);
                                if (node) {
                                    const nodeData = node.data as RunPythonNodeData;
                                    if (nodeData.code.trim()) {
                                        try {
                                            // Simulate running the Python code and getting output
                                            nodeData.status = "success";
                                            
                                            // Add a simulated output based on common Python operations
                                            if (nodeData.code.includes('print(')) {
                                                nodeData.output = `> Python executed at ${new Date().toLocaleTimeString()}\n`;
                                                
                                                // Extract content from print statements where possible
                                                const printMatches = nodeData.code.match(/print\((.*?)\)/g);
                                                if (printMatches) {
                                                    printMatches.forEach(match => {
                                                        const content = match.substring(6, match.length - 1);
                                                        nodeData.output += `${content}\n`;
                                                    });
                                                } else {
                                                    nodeData.output += "> Print output\n";
                                                }
                                            } else if (nodeData.code.includes('import numpy') || nodeData.code.includes('import pandas')) {
                                                nodeData.output = `> Python executed at ${new Date().toLocaleTimeString()}\n> Data analysis operations completed successfully`;
                                            } else if (nodeData.code.includes('requests.')) {
                                                nodeData.output = `> Python executed at ${new Date().toLocaleTimeString()}\n> Network request simulated - Response: <Response [200]>`;
                                            } else if (nodeData.code.includes('os.') || nodeData.code.includes('import os')) {
                                                nodeData.output = `> Python executed at ${new Date().toLocaleTimeString()}\n> OS operations completed\n> Files accessed successfully`;
                                            } else if (nodeData.code.includes('GPIO') || nodeData.code.includes('RPi')) {
                                                nodeData.output = `> Python executed at ${new Date().toLocaleTimeString()}\n> GPIO pins configured successfully\n> Raspberry Pi hardware accessed`;
                                            } else {
                                                nodeData.output = `> Python code executed successfully at ${new Date().toLocaleTimeString()}`;
                                            }
                                            
                                            setShowSuccess(true);
                                        } catch (error) {
                                            nodeData.status = "error";
                                            nodeData.errorMessage = `Error executing Python: ${error instanceof Error ? error.message : 'Unknown error'}`;
                                        }
                                    } else {
                                        nodeData.status = "error";
                                        nodeData.errorMessage = "Python code cannot be empty";
                                    }
                                }
                            }),
                        );
                    }, 1000);
                }
            }),
        );
    }, [id, setNodes]);

    // Create a portal for the modal to be rendered directly in the body
    // This ensures it's positioned relative to the viewport, not the node
    const editorModal = showEditor
        ? createPortal(
              <div 
                className={cn(
                  "fixed inset-0 flex items-center justify-center z-[9999] bg-black/70",
                  isClosing ? "animate-fadeOut" : "animate-fadeIn"
                )}
                onClick={(e) => e.target === e.currentTarget && !isSaving && closeEditorModal()}
                style={{ 
                  animation: isClosing ? 'fadeOut 0.3s ease-in' : (showEditor ? 'fadeIn 0.2s ease-out' : 'none'),
                }}
              >
                  <div 
                    ref={modalRef}
                    className={cn(
                        "bg-dark-300 rounded-xl w-[90vw] max-w-5xl shadow-lg border border-dark-100 flex flex-col",
                        isClosing ? "animate-scale-out" : "animate-scale-in"
                    )}
                    style={{ 
                        animation: isClosing ? 'scaleOut 0.3s ease-in' : (showEditor ? 'scaleIn 0.2s ease-out' : 'none'),
                        height: '85vh'
                    }}
                  >
                      <div className="flex items-center justify-between py-3 px-4 border-b border-dark-200">
                          <div className="flex items-center gap-2">
                              <div className={cn(meta.icon, "size-5 text-green-500")} />
                              <h3 className="font-medium text-light-900/90">Python Editor</h3>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 mr-4">
                                <button 
                                    onClick={decreaseFontSize}
                                    title="Decrease font size"
                                    className="size-7 flex items-center justify-center border border-dark-100 rounded-md bg-dark-400/50 text-light-900/70 outline-none 
                                        hover:(bg-dark-100 text-light-900) active:(bg-dark-400)"
                                >
                                    <div className="i-mdi:format-font-size-decrease size-4" />
                                </button>
                                <span className="text-xs text-light-900/70 w-8 text-center">{fontSize}px</span>
                                <button 
                                    onClick={increaseFontSize}
                                    title="Increase font size"
                                    className="size-7 flex items-center justify-center border border-dark-100 rounded-md bg-dark-400/50 text-light-900/70 outline-none 
                                        hover:(bg-dark-100 text-light-900) active:(bg-dark-400)"
                                >
                                    <div className="i-mdi:format-font-size-increase size-4" />
                                </button>
                              </div>
                              <button 
                                  onClick={formatCode}
                                  title="Format code"
                                  className="size-7 flex items-center justify-center border border-dark-100 rounded-md bg-dark-400/50 text-light-900/70 outline-none 
                                          hover:(bg-green-500/20 border-green-500/30 text-green-400) active:(bg-green-500/30)"
                              >
                                  <div className="i-mdi:format-align-left size-4" />
                              </button>
                              <button 
                                  onClick={closeEditorModal}
                                  title="Close"
                                  className="size-7 flex items-center justify-center border border-dark-100 rounded-md bg-dark-400/50 text-light-900/70 outline-none 
                                          hover:(bg-dark-100 text-light-900) active:(bg-dark-400)"
                              >
                                  <div className="i-mdi:close size-4" />
                              </button>
                          </div>
                      </div>
                      <div className="flex-1 relative overflow-hidden">
                          <AceEditor
                              ref={editorRef}
                              mode="python"
                              theme="tomorrow_night"
                              name={`modal-python-editor-${id}`}
                              value={editorCode}
                              onChange={handleEditorChange}
                              fontSize={fontSize}
                              showPrintMargin={false}
                              showGutter={true}
                              highlightActiveLine={true}
                              width="100%"
                              height="100%"
                              wrapEnabled={true}
                              keyboardHandler="vscode"
                              editorProps={{ $blockScrolling: true }}
                              setOptions={{
                                  enableBasicAutocompletion: true,
                                  enableLiveAutocompletion: true,
                                  enableSnippets: true,
                                  showLineNumbers: true,
                                  tabSize: 4,
                                  useWorker: true,
                              }}
                              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                          />
                      </div>
                      <div className="py-3 px-4 border-t border-dark-200 flex justify-between gap-2 bg-dark-400/30">
                          <div className="flex items-center gap-2">
                              <button 
                                  onClick={undo}
                                  disabled={historyIndex <= 0}
                                  className={cn(
                                    "size-7 flex items-center justify-center border border-dark-100 rounded-md bg-dark-400/50 text-light-900/70 outline-none",
                                    historyIndex > 0 ? "hover:(bg-dark-100 text-light-900) active:(bg-dark-400)" : "opacity-50 cursor-not-allowed"
                                  )}
                                  title="Undo (Ctrl+Z)"
                              >
                                  <div className="i-mdi:undo size-4" />
                              </button>
                              <button 
                                  onClick={redo}
                                  disabled={historyIndex >= codeHistory.length - 1}
                                  className={cn(
                                    "size-7 flex items-center justify-center border border-dark-100 rounded-md bg-dark-400/50 text-light-900/70 outline-none",
                                    historyIndex < codeHistory.length - 1 ? "hover:(bg-dark-100 text-light-900) active:(bg-dark-400)" : "opacity-50 cursor-not-allowed"
                                  )}
                                  title="Redo (Ctrl+Y)"
                              >
                                  <div className="i-mdi:redo size-4" />
                              </button>
                              <div className="text-xs text-light-900/50 ml-2">
                                  {historyIndex + 1} of {codeHistory.length} changes
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <button 
                                  onClick={closeEditorModal}
                                  className="px-4 py-1.5 rounded-md border border-dark-100 bg-dark-400/50 text-light-900/70 text-sm 
                                          hover:(bg-dark-100 text-light-900) active:(bg-dark-400)"
                              >
                                  Cancel
                              </button>
                              <button 
                                  onClick={saveEditorCode}
                                  disabled={isSaving}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md border text-sm transition-all",
                                    isSaving 
                                      ? "bg-green-500/40 border-green-500/50 text-green-300" 
                                      : "border-green-500/30 bg-green-500/20 text-green-400 hover:(bg-green-500/30 border-green-500/40) active:(bg-green-500/40)"
                                  )}
                              >
                                  <span className="flex items-center">
                                      {isSaving ? (
                                        <>
                                          <div className="i-mdi:check-circle animate-pulse mr-1.5 size-4" /> 
                                          Saving...
                                        </>
                                      ) : (
                                        <>
                                          <div className="i-mdi:content-save mr-1.5 size-4" /> 
                                          Save Changes
                                        </>
                                      )}
                                  </span>
                              </button>
                          </div>
                      </div>
                  </div>
              </div>,
              document.body
          )
        : null;

    return (
        <div
            data-selected={selected}
            className="w-[320px] border border-dark-200 rounded-xl bg-dark-300/90 shadow-sm transition-all duration-300 divide-y divide-dark-200
                     data-[selected=true]:(border-green-500 ring-1 ring-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.15)])"
        >
            <div className="relative overflow-clip rounded-t-xl bg-dark-300">
                <div className="absolute inset-0">
                    <div className="absolute h-full w-3/5 from-green-600/20 to-transparent bg-gradient-to-r" />
                </div>
                <div className="relative h-9 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
                    <div className="flex grow items-center pl-0.5">
                        <div className="size-7 flex items-center justify-center">
                            <div className="size-6 flex items-center justify-center rounded-lg">
                                <div className={cn(meta.icon, "size-4 text-green-500 transition-transform duration-300", selected && "animate-pulse")} />
                            </div>
                        </div>
                        <div className="ml-1 text-xs font-medium leading-none tracking-wide uppercase op-80">
                            <span className="translate-y-px">{meta.title}</span>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
                        <button
                            type="button"
                            className="size-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-green-400 outline-none transition-all duration-200 active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100 rotate-12)"
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
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-light-900/50 font-medium">Python Code</div>
                            <button
                                type="button"
                                onClick={openEditorModal}
                                className="size-6 flex items-center justify-center border border-dark-100 rounded-md bg-dark-400/70 text-light-900/70 outline-none transition-all duration-200 
                                        hover:(bg-green-500/20 border-green-500/30 text-green-400) active:(bg-green-500/30)"
                                title="Open in fullscreen editor"
                            >
                                <div className="i-mdi:fullscreen size-3.5" />
                            </button>
                        </div>
                        <div className="mt-2 flex flex-col gap-3">
                            <div className="border border-dark-100 rounded-md bg-dark-500/90 overflow-hidden max-w-full">
                                <AceEditor
                                    mode="python"
                                    theme="tomorrow_night"
                                    name={`python-editor-${id}`}
                                    value={data.code}
                                    onChange={updateCode}
                                    fontSize={12}
                                    showPrintMargin={false}
                                    showGutter={true}
                                    highlightActiveLine={true}
                                    width="100%"
                                    height="150px"
                                    wrapEnabled={true}
                                    editorProps={{ $blockScrolling: true }}
                                    setOptions={{
                                        enableBasicAutocompletion: true,
                                        enableLiveAutocompletion: true,
                                        enableSnippets: true,
                                        showLineNumbers: true,
                                        tabSize: 4,
                                        useWorker: false,
                                    }}
                                    style={{ width: '100%', maxWidth: '100%' }}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    className={cn(
                                        "px-3 py-1.5 text-xs rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95",
                                        data.status === "running" ? "bg-yellow-500/20 text-yellow-400 cursor-wait" : "bg-green-500/20 text-green-400 hover:bg-green-500/30",
                                    )}
                                    onClick={executeCode}
                                    disabled={data.status === "running"}
                                >
                                    {data.status === "running" ? (
                                        <span className="flex items-center">
                                            <div className="i-mdi:loading animate-spin mr-1 size-3" /> Running...
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <div className="i-mdi:play mr-1 size-3" /> Execute
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <CustomHandle
                        type="target"
                        id={targetHandleId}
                        position={Position.Left}
                        isConnectable={isConnectable}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-green-500/50 important:scale-110)"
                    />
                    <CustomHandle
                        type="source"
                        id={sourceHandleId}
                        position={Position.Right}
                        isConnectable={isConnectable && data.status === "success"}
                        className="top-6! transition-all duration-300 hover:(important:ring-2 important:ring-green-500/50 important:scale-110)"
                    />
                </div>
                <div className="flex flex-col p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-light-900/50 font-medium">Output</div>
                        <div className="flex items-center gap-2 group">
                            <div
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    data.status === "success" && "bg-green-500 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]",
                                    data.status === "running" && "bg-yellow-500 animate-pulse",
                                    data.status === "idle" && "bg-gray-500",
                                    data.status === "error" && "bg-red-500 animate-pulse",
                                )}
                            />
                            <div
                                className={cn(
                                    "text-xs font-medium capitalize transition-colors duration-300",
                                    data.status === "success" && "text-green-400",
                                    data.status === "running" && "text-yellow-400",
                                    data.status === "idle" && "text-gray-400",
                                    data.status === "error" && "text-red-400",
                                )}
                            >
                                {data.status}
                            </div>
                        </div>
                    </div>
                    {showSuccess && (
                        <div className="mt-2 py-1.5 px-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs text-green-400 animate-fadeIn flex items-center">
                            <div className="i-mdi:check-circle mr-1.5 size-4" />
                            Python code executed successfully!
                        </div>
                    )}
                    {data.output && (
                        <div
                            className="mt-2 p-2 border border-dark-100 rounded-md bg-dark-500/90 text-xs font-mono text-light-900/80 whitespace-pre-wrap overflow-auto max-h-32 break-words
                                        transition-all duration-300 hover:border-dark-50"
                        >
                            {data.output}
                        </div>
                    )}
                    {data.errorMessage && <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 animate-pulse break-words">{data.errorMessage}</div>}
                </div>
                <div className="overflow-clip rounded-b-xl bg-dark-300/30 px-4 py-2 text-xs text-light-900/50">
                    Node: <span className="text-light-900/60 font-semibold">#{id}</span>
                </div>
            </div>

            {/* Portal-based Modal */}
            {editorModal}
        </div>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: RegisterNodeMetadata<RunPythonNodeData> = {
    type: NODE_TYPE,
    node: memo(RunPythonNode),
    detail: {
        icon: "i-vscode-icons:file-type-python",
        title: "Run Python",
        description: "Execute Python code on the connected Raspberry Pi.",
        category: NodeCategory.EXECUTION
    },
    defaultData: {
        code: "# Write your Python code here\nprint('Hello from Raspberry Pi!')\n",
        output: "",
        status: "idle",
    },
};