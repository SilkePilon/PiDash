import { memo, useMemo } from "react";

import { GitHubOperationDetails } from "~/modules/nodes/nodes/github-node/constants/operations";
import { type GitHubNodeData } from "~/modules/nodes/nodes/github-node/github.node";
import { type BuilderNodeType } from "~/modules/nodes/types";

type Props = {
    id: string;
    type: BuilderNodeType;
    data: GitHubNodeData;
    updateData: (data: Partial<GitHubNodeData>) => void;
};

function GitHubNodePropertyPanel({ id, data, updateData }: Props) {
    const operationDetails = GitHubOperationDetails[data.operation];

    // Operations that need an API key
    const needsApiKey = useMemo(() => {
        return ["push", "commit", "webhook"].includes(data.operation);
    }, [data.operation]);

    return (
        <div className="flex flex-col gap-y-4 px-4 py-4">
            <section className="rounded-lg bg-dark-400/30 p-3">
                <div className="flex items-center gap-x-2">
                    <div className="i-uil:github size-4.5 text-purple-400" />
                    <div className="text-xs font-medium">Node #{id}</div>
                </div>
            </section>

            <section>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-light-900/70 font-medium mb-1.5">Operation</label>
                        <div className="text-[11px] text-light-900/50 mb-2 leading-snug">{operationDetails.description}</div>
                        <select
                            value={data.operation}
                            onChange={(e) => updateData({ operation: e.target.value as any })}
                            className="w-full px-2.5 h-8 bg-dark-400/50 border border-dark-200 rounded-lg text-xs focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                        >
                            {Object.entries(GitHubOperationDetails).map(([value, details]) => (
                                <option key={value} value={value} className="bg-dark-400 text-light-900/90">
                                    {details.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {needsApiKey && (
                        <div>
                            <label className="block text-xs text-light-900/70 font-medium mb-1.5">
                                GitHub API Key
                            </label>
                            <input
                                type="password"
                                value={data.apiKey || ""}
                                onChange={(e) => updateData({ apiKey: e.target.value })}
                                placeholder="ghp_xxxxxxxxxxxx"
                                className="w-full px-2.5 h-8 bg-dark-400/50 border border-dark-200 rounded-lg text-xs placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                            />
                            <details className="mt-1.5 text-[11px] marker:text-purple-500">
                                <summary className="text-purple-400 cursor-pointer hover:text-purple-300">
                                    How to get an API key
                                </summary>
                                <div className="mt-2 p-2 bg-dark-400/20 border border-dark-200 rounded-lg text-light-900/60 leading-relaxed">
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Go to GitHub.com and sign in</li>
                                        <li>Click profile picture → Settings</li>
                                        <li>Developer settings → Tokens (classic)</li>
                                        <li>Generate new token (classic)</li>
                                        <li className="leading-normal">Add note (e.g. "PiDash") and select:
                                            <ul className="list-disc list-inside pl-3 mt-1 text-light-900/50">
                                                <li>repo (Repository access)</li>
                                                <li>admin:repo_hook (Webhooks)</li>
                                            </ul>
                                        </li>
                                        <li>Generate and copy the token</li>
                                    </ol>
                                </div>
                            </details>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-light-900/70 font-medium mb-1.5">
                            Repository
                        </label>
                        <input
                            type="text"
                            value={data.repository || ""}
                            onChange={(e) => updateData({ repository: e.target.value })}
                            placeholder="username/repo"
                            className="w-full px-2.5 h-8 bg-dark-400/50 border border-dark-200 rounded-lg text-xs placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-light-900/70 font-medium mb-1.5">
                            Branch Name
                        </label>
                        <input
                            type="text"
                            value={data.branch || ""}
                            onChange={(e) => updateData({ branch: e.target.value })}
                            placeholder="main"
                            className="w-full px-2.5 h-8 bg-dark-400/50 border border-dark-200 rounded-lg text-xs placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                        />
                    </div>

                    {data.operation === "commit" && (
                        <div>
                            <label className="block text-xs text-light-900/70 font-medium mb-1.5">
                                Commit Message
                            </label>
                            <input
                                type="text"
                                value={data.commitMessage || ""}
                                onChange={(e) => updateData({ commitMessage: e.target.value })}
                                placeholder="Update files"
                                className="w-full px-2.5 h-8 bg-dark-400/50 border border-dark-200 rounded-lg text-xs placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                            />
                        </div>
                    )}

                    {data.operation === "webhook" && (
                        <div>
                            <label className="block text-xs text-light-900/70 font-medium mb-1.5">
                                Event Trigger
                            </label>
                            <select
                                value={data.eventTrigger || "push"}
                                onChange={(e) => updateData({ eventTrigger: e.target.value })}
                                className="w-full px-2.5 h-8 bg-dark-400/50 border border-dark-200 rounded-lg text-xs focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                            >
                                {[
                                    ["push", "Push Events"],
                                    ["pull_request", "Pull Request Events"],
                                    ["issues", "Issue Events"],
                                    ["release", "Release Events"],
                                    ["star", "Repository Star Events"],
                                    ["fork", "Repository Fork Events"],
                                    ["workflow_run", "Workflow Run Events"]
                                ].map(([value, label]) => (
                                    <option key={value} value={value} className="bg-dark-400 text-light-900/90">
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {(data.operation === "commit" || data.operation === "push") && (
                        <div>
                            <label className="block text-xs text-light-900/70 font-medium mb-1.5">
                                File Path
                            </label>
                            <input
                                type="text"
                                value={data.filePath || ""}
                                onChange={(e) => updateData({ filePath: e.target.value })}
                                placeholder="path/to/file.txt"
                                className="w-full px-2.5 h-8 bg-dark-400/50 border border-dark-200 rounded-lg text-xs placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                            />
                            <div className="mt-1 text-[11px] text-light-900/50">
                                {data.operation === "push" ? "Push all changes or specify a file" : "Commit all changes or specify a file"}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default memo(GitHubNodePropertyPanel);