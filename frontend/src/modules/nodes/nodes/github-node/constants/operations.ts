export enum GitHubOperation {
    PULL = "pull",
    PUSH = "push",
    COMMIT = "commit",
    STATUS = "status",
    WEBHOOK = "webhook",
}

export type GitHubOperationType = `${GitHubOperation}`;

export interface GitHubOperationDetail {
    name: string;
    icon: string;
    description: string;
}

// @unocss-include
export const GitHubOperationDetails: Record<GitHubOperationType, GitHubOperationDetail> = {
    [GitHubOperation.PULL]: { 
        name: "Pull", 
        icon: "i-tabler:git-pull-request", 
        description: "Pull latest changes from a remote repository"
    },
    [GitHubOperation.PUSH]: { 
        name: "Push", 
        icon: "i-mdi:source-branch", 
        description: "Push local changes to a remote repository"
    },
    [GitHubOperation.COMMIT]: { 
        name: "Commit", 
        icon: "i-ri:git-commit-fill", 
        description: "Commit changes to the local repository"
    },
    [GitHubOperation.STATUS]: { 
        name: "Status", 
        icon: "i-octicon:git-compare-16", 
        description: "Check the status of the repository"
    },
    [GitHubOperation.WEBHOOK]: { 
        name: "Webhook", 
        icon: "i-mdi:webhook", 
        description: "Respond to GitHub webhook events"
    },
};

export function getGitHubOperationDetails(operation: GitHubOperationType) {
    return GitHubOperationDetails[operation];
}