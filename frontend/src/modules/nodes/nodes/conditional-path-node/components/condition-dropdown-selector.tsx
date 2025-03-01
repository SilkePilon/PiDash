import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { nanoid } from "nanoid";

import { cn } from "~@/utils/cn";

const conditionList = [
    { id: nanoid(), condition: "CPU temperature exceeds threshold" },
    { id: nanoid(), condition: "Memory usage above threshold" },
    { id: nanoid(), condition: "System load is high" },
    { id: nanoid(), condition: "GPIO pin state changed" },
    { id: nanoid(), condition: "Network connectivity lost" },
    { id: nanoid(), condition: "Storage space low" },
    { id: nanoid(), condition: "Process is running" },
    { id: nanoid(), condition: "Process has stopped" },
    { id: nanoid(), condition: "Power consumption above normal" },
    { id: nanoid(), condition: "System has been up for X hours" },
    { id: nanoid(), condition: "USB device connected" },
    { id: nanoid(), condition: "USB device disconnected" },
];

type ConditionDropdownSelectorProps = Readonly<{
    value: { id: string; condition: string } | null;
    onChange: (value: { id: string; condition: string } | null) => void;
}>;

export function ConditionDropdownSelector({ value, onChange }: ConditionDropdownSelectorProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="h-8 w-full flex items-center justify-between border border-dark-50 rounded-md bg-dark-300 px-2.5 outline-none transition active:(border-dark-200 bg-dark-400/50) data-[state=open]:(border-dark-200 bg-dark-500) data-[state=closed]:(hover:bg-dark-300)"
                >
                    <div className="flex items-center">
                        <div className="i-mdi:raspberry-pi mr-1.5 size-4 text-red-400" />
                        <div className="text-sm font-medium leading-none tracking-wide">{value ? value.condition : "Select Pi Condition"}</div>
                    </div>

                    <div className="i-lucide:chevrons-up-down ml-1 size-3 op-50" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="start"
                    sideOffset={5}
                    className={cn(
                        "min-w-40 select-none border border-dark-100 rounded-lg bg-dark-200/90 p-0.5 text-light-50 shadow-xl backdrop-blur-lg transition",
                        "animate-in data-[side=top]:slide-in-bottom-0.5 data-[side=bottom]:slide-in-bottom--0.5 data-[side=bottom]:fade-in-40 data-[side=top]:fade-in-40",
                    )}
                >
                    {conditionList.map(({ id, condition }) => (
                        <DropdownMenu.Item
                            key={id}
                            className="h-8 flex cursor-pointer items-center border border-transparent rounded-lg p-1.5 pr-6 outline-none transition active:(border-dark-100 bg-dark-300) hover:bg-dark-100"
                            onSelect={() => onChange({ id, condition })}
                        >
                            <div className="flex items-center gap-x-2">
                                {condition.includes("CPU") && <div className="i-mdi:cpu-64-bit size-3.5 text-orange-400" />}
                                {condition.includes("Memory") && <div className="i-mdi:memory size-3.5 text-blue-400" />}
                                {condition.includes("GPIO") && <div className="i-mdi:controller size-3.5 text-green-400" />}
                                {condition.includes("Network") && <div className="i-mdi:wifi size-3.5 text-cyan-400" />}
                                {condition.includes("Storage") && <div className="i-mdi:harddisk size-3.5 text-purple-400" />}
                                {condition.includes("Process") && <div className="i-mdi:application size-3.5 text-yellow-400" />}
                                {condition.includes("Power") && <div className="i-mdi:power size-3.5 text-red-400" />}
                                {condition.includes("System") && <div className="i-mdi:server size-3.5 text-slate-400" />}
                                {condition.includes("USB") && <div className="i-mdi:usb size-3.5 text-blue-400" />}
                                <div className="text-xs font-medium leading-none tracking-wide">{condition}</div>
                            </div>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
