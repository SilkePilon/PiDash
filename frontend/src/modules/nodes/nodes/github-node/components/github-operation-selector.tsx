import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useCallback } from "react";

import { type GitHubOperationDetail, type GitHubOperationType, GitHubOperationDetails } from "~/modules/nodes/nodes/github-node/constants/operations";

import { cn } from "~@/utils/cn";

type Props = {
    detail: GitHubOperationDetail;
    onSelect: (operation: GitHubOperationDetail & { type: GitHubOperationType }) => void;
};

export function GitHubOperationSelector({ detail, onSelect }: Props) {
    const handleSelectOperation = useCallback(
        (operation: GitHubOperationType) => {
            onSelect({
                ...GitHubOperationDetails[operation],
                type: operation,
            });
        },
        [onSelect],
    );

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="h-7 flex items-center justify-center border border-transparent rounded-lg bg-transparent px-1.2 outline-none transition active:(border-dark-200 bg-dark-400/50) data-[state=open]:(border-dark-200 bg-dark-500) data-[state=closed]:(hover:bg-dark-100)"
                >
                    <div className={cn(detail.icon, "size-4")} />
                    <div className="i-lucide:chevrons-up-down ml-1 size-3 op-50" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    side="bottom"
                    align="end"
                    sideOffset={5}
                    className={cn(
                        "z-50 w-48 overflow-hidden rounded-xl border border-dark-200 bg-dark-300 shadow-lg",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[side=bottom]:slide-in-from-top-2",
                        "data-[side=left]:slide-in-from-right-2",
                        "data-[side=right]:slide-in-from-left-2",
                        "data-[side=top]:slide-in-from-bottom-2",
                    )}
                >
                    <div className="mb-1 px-2 py-1.5 text-xs text-light-900/50 font-medium">
                        Select Operation
                    </div>

                    {Object.entries(GitHubOperationDetails).map(([type, operation]) => (
                        <DropdownMenu.Item
                            key={type}
                            onClick={() => handleSelectOperation(type as GitHubOperationType)}
                            className={cn(
                                "relative flex cursor-default select-none items-center gap-x-2 px-2.5 py-1.5",
                                "text-sm outline-none transition-colors",
                                "data-[highlighted]:bg-dark-200 data-[highlighted]:text-light-900",
                                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                            )}
                        >
                            <span className={cn(operation.icon, "size-4 text-light-900/70")} />
                            <span>{operation.name}</span>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}