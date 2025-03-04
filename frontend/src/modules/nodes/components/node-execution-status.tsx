import { memo } from "react";
import { ExecutionStatus, type ExecutionStatusType } from "~/modules/nodes/types";
import { cn } from "~@/utils/cn";

interface NodeExecutionStatusProps {
  executionStatus?: ExecutionStatusType;
  executing?: boolean;
  className?: string;
}

export const NodeExecutionStatus = memo(({ executionStatus = ExecutionStatus.NONE, executing = false, className }: NodeExecutionStatusProps) => {
  // If executing, show the running animation regardless of status
  const status = executing ? ExecutionStatus.RUNNING : executionStatus;
  
  // Icons for each status
  const iconMap = {
    [ExecutionStatus.NONE]: null,
    [ExecutionStatus.PENDING]: "i-mdi:clock-outline",
    [ExecutionStatus.RUNNING]: "i-mdi:loading",
    [ExecutionStatus.SUCCESS]: "i-mdi:check-circle",
    [ExecutionStatus.ERROR]: "i-mdi:alert-circle",
    [ExecutionStatus.SKIPPED]: "i-mdi:skip-next-circle",
  };
  
  // Colors for each status
  const colorMap = {
    [ExecutionStatus.NONE]: "",
    [ExecutionStatus.PENDING]: "text-blue-400",
    [ExecutionStatus.RUNNING]: "text-yellow-400",
    [ExecutionStatus.SUCCESS]: "text-green-400", 
    [ExecutionStatus.ERROR]: "text-red-400",
    [ExecutionStatus.SKIPPED]: "text-gray-400",
  };
  
  // Animation for each status
  const animationMap = {
    [ExecutionStatus.NONE]: "",
    [ExecutionStatus.PENDING]: "",
    [ExecutionStatus.RUNNING]: "animate-spin",
    [ExecutionStatus.SUCCESS]: "",
    [ExecutionStatus.ERROR]: "animate-pulse",
    [ExecutionStatus.SKIPPED]: "",
  };
  
  // Background colors for each status
  const bgColorMap = {
    [ExecutionStatus.NONE]: "",
    [ExecutionStatus.PENDING]: "bg-blue-500/10",
    [ExecutionStatus.RUNNING]: "bg-yellow-500/10",
    [ExecutionStatus.SUCCESS]: "bg-green-500/10",
    [ExecutionStatus.ERROR]: "bg-red-500/10",
    [ExecutionStatus.SKIPPED]: "bg-gray-500/10",
  };
  
  // If no status, don't render anything
  if (status === ExecutionStatus.NONE && !executing) {
    return null;
  }
  
  const icon = iconMap[status];
  const color = colorMap[status];
  const animation = animationMap[status];
  const bgColor = bgColorMap[status];
  
  return (
    <div 
      className={cn(
        "absolute top-9 right-9 flex items-center justify-center size-5 rounded-full transition-all duration-300 z-10",
        bgColor,
        className
      )}
    >
      {icon && (
        <div 
          className={cn(
            "size-4",
            icon, 
            color, 
            animation
          )}
        />
      )}
    </div>
  );
});