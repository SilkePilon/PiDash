import { useState } from "react";
import { cn } from "~@/utils/cn";

interface SaveFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => void;
  isSaving?: boolean;
}

export function SaveFlowDialog({ isOpen, onClose, onSave, isSaving }: SaveFlowDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm">
      <div 
        className="w-[400px] border border-dark-200 rounded-xl bg-dark-300/90 shadow-lg animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative overflow-clip rounded-t-xl bg-dark-300">
          <div className="absolute inset-0"></div>
          <div className="absolute h-full w-3/5 from-teal-600/20 to-transparent bg-gradient-to-r" />

          <div className="relative h-11 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
            <div className="flex grow items-center pl-2">
              <div className="size-7 flex items-center justify-center">
                <div className="i-mdi:content-save text-teal-400 size-5" />
              </div>

              <div className="ml-1 text-sm font-medium leading-none tracking-wide">
                Save Flow
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
              <button
                type="button"
                className="size-8 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-teal-400 outline-none transition-all duration-200 active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100 rotate-12)"
                onClick={onClose}
              >
                <div className="i-mdi:close size-5" />
              </button>
            </div>
          </div>
        </div>

        <form 
          className="p-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, description });
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-light-900/70">Flow Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for your flow"
                className="w-full bg-dark-500 border border-dark-100 rounded py-2 px-3
                         transition-colors duration-200 hover:border-teal-500/30 focus:border-teal-500
                         focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm text-light-900/70">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your flow does"
                className="w-full bg-dark-500 border border-dark-100 rounded py-2 px-3
                         transition-colors duration-200 hover:border-teal-500/30 focus:border-teal-500
                         focus:outline-none resize-none h-24"
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-dark-400/50 text-light-900/70 hover:bg-dark-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "px-4 py-2 rounded-lg bg-teal-500 text-white font-medium",
                  "transition-all duration-200 hover:bg-teal-600 active:transform active:scale-95",
                  "flex items-center gap-2",
                  isSaving && "opacity-50 cursor-wait"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="i-mdi:loading animate-spin size-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <div className="i-mdi:content-save size-4" />
                    Save Flow
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}