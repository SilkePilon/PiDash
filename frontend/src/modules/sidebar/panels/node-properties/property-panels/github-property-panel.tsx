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
        <div className="flex flex-col gap-y-6 px-6 py-6">
            <section className="rounded-lg bg-dark-400/30 p-4">
                <div className="flex items-center gap-x-3">
                    <div className="i-uil:github size-5 text-purple-400" />
                    <div className="text-sm font-medium">GitHub Node #{id}</div>
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-sm font-semibold text-light-900/90">Operation Settings</h2>
                <div className="space-y-5">
                    <div>
                        <label className="flex items-center gap-x-2 text-xs text-light-900/70 font-medium mb-2">
                            <span>{operationDetails.name}</span>
                            <span className="text-light-900/50">•</span>
                            <span className="text-light-900/50">{operationDetails.description}</span>
                        </label>
                        <select
                            value={data.operation}
                            onChange={(e) => updateData({ operation: e.target.value as any })}
                            className="w-full px-3 h-9 bg-dark-400/50 border border-dark-200 rounded-lg text-sm focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
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
                            <label className="block text-xs text-light-900/70 font-medium mb-2">
                                GitHub API Key
                            </label>
                            <input
                                type="password"
                                value={data.apiKey || ""}
                                onChange={(e) => updateData({ apiKey: e.target.value })}
                                placeholder="ghp_xxxxxxxxxxxx"
                                className="w-full px-3 h-9 bg-dark-400/50 border border-dark-200 rounded-lg text-sm placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                            />
                            <details className="mt-2 group marker:text-purple-500">
                                <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300">
                                    How to get an API key
                                </summary>
                                <div className="mt-2 p-3 bg-dark-400/20 border border-dark-200 rounded-lg text-xs text-light-900/60 leading-relaxed">
                                    <ol className="list-decimal list-inside space-y-1 pl-1">
                                        <li>Go to GitHub.com and sign in</li>
                                        <li>Click your profile picture → Settings</li>
                                        <li>Developer settings → Personal access tokens → Tokens (classic)</li>
                                        <li>Generate new token → Generate new token (classic)</li>
                                        <li>Add a note (e.g. "PiDash") and select scopes:
                                            <ul className="list-disc list-inside pl-4 mt-1 text-light-900/50">
                                                <li>repo (Full control of repositories)</li>
                                                <li>admin:repo_hook (Repository hooks)</li>
                                            </ul>
                                        </li>
                                        <li>Click "Generate token" and copy it here</li>
                                    </ol>
                                </div>
                            </details>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs text-light-900/70 font-medium mb-2">
                            Repository
                        </label>
                        <input
                            type="text"
                            value={data.repository || ""}
                            onChange={(e) => updateData({ repository: e.target.value })}
                            placeholder="username/repo"
                            className="w-full px-3 h-9 bg-dark-400/50 border border-dark-200 rounded-lg text-sm placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-light-900/70 font-medium mb-2">
                            Branch Name
                        </label>
                        <input
                            type="text"
                            value={data.branch || ""}
                            onChange={(e) => updateData({ branch: e.target.value })}
                            placeholder="main"
                            className="w-full px-3 h-9 bg-dark-400/50 border border-dark-200 rounded-lg text-sm placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                        />
                    </div>

                    {data.operation === "commit" && (
                        <div>
                            <label className="block text-xs text-light-900/70 font-medium mb-2">
                                Commit Message
                            </label>
                            <input
                                type="text"
                                value={data.commitMessage || ""}
                                onChange={(e) => updateData({ commitMessage: e.target.value })}
                                placeholder="Update files"
                                className="w-full px-3 h-9 bg-dark-400/50 border border-dark-200 rounded-lg text-sm placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                            />
                        </div>
                    )}

                    {data.operation === "webhook" && (
                        <div>
                            <label className="block text-xs text-light-900/70 font-medium mb-2">
                                Event Trigger
                            </label>
                            <select
                                value={data.eventTrigger || "push"}
                                onChange={(e) => updateData({ eventTrigger: e.target.value })}
                                className="w-full px-3 h-9 bg-dark-400/50 border border-dark-200 rounded-lg text-sm focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
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
                            <label className="block text-xs text-light-900/70 font-medium mb-2">
                                File Path
                            </label>
                            <input
                                type="text"
                                value={data.filePath || ""}
                                onChange={(e) => updateData({ filePath: e.target.value })}
                                placeholder="path/to/file.txt"
                                className="w-full px-3 h-9 bg-dark-400/50 border border-dark-200 rounded-lg text-sm placeholder:text-light-900/30 focus:(outline-none ring-1 ring-purple-500/50 border-purple-500/50)"
                            />
                            <div className="mt-1.5 text-xs text-light-900/50">
                                Leave blank to {data.operation} all changes, or specify a path for a single file
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default memo(GitHubNodePropertyPanel);