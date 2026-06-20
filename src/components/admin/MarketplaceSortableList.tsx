import React from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export type GroupSortMode = "manual" | "renewal" | "capacity" | "available";

interface SortableItemProps {
    id: string;
    isDraggable: boolean;
    children: React.ReactNode;
}

export function SortableItem({ id, isDraggable, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isDraggable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? "relative" as const : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? "ring-2 ring-zinc-900 ring-offset-2 rounded-2xl" : ""}>
            <div className="flex items-stretch gap-2">
                {isDraggable && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex items-center justify-center w-8 shrink-0 cursor-grab active:cursor-grabbing touch-none rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
                    >
                        <GripVertical size={16} className="text-gray-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
}

interface SortableGroupContainerProps {
    items: string[];
    isDraggable: boolean;
    onDragEnd: (oldIndex: number, newIndex: number) => void;
    onDragStart: () => void;
    children: React.ReactNode;
}

export function SortableGroupContainer({
    items,
    isDraggable,
    onDragEnd,
    onDragStart,
    children,
}: SortableGroupContainerProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;
        onDragEnd(oldIndex, newIndex);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">{children}</div>
            </SortableContext>
            <DragOverlay>
                <div className="rounded-2xl bg-white shadow-2xl shadow-black/20 ring-1 ring-black/5 scale-105 opacity-90 p-1" />
            </DragOverlay>
        </DndContext>
    );
}

interface GroupSortSelectProps {
    value: GroupSortMode;
    onChange: (mode: GroupSortMode) => void;
}

export function GroupSortSelect({ value, onChange }: GroupSortSelectProps) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value as GroupSortMode)}
            className="h-8 rounded-xl border border-black/5 bg-zinc-50 px-2.5 text-[10px] font-black text-zinc-600 outline-none transition focus:border-zinc-900 focus:bg-white"
            aria-label="Sort listings"
        >
            <option value="manual">Manual Order</option>
            <option value="renewal">Renewal Date</option>
            <option value="capacity">Capacity</option>
            <option value="available">Available Slots</option>
        </select>
    );
}
