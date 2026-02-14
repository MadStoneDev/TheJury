"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";

interface RankedChoiceOption {
  id: string;
  text: string;
}

interface RankedChoiceInputProps {
  options: RankedChoiceOption[];
  rankings: string[];
  onChange: (rankings: string[]) => void;
  disabled?: boolean;
}

function SortableItem({
  option,
  rank,
  disabled,
}: {
  option: RankedChoiceOption;
  rank: number;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
        isDragging
          ? "border-emerald-500 bg-emerald-500/5 shadow-lg z-10"
          : "border-border bg-card"
      } ${disabled ? "opacity-70" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`touch-none ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      >
        <IconGripVertical className="w-5 h-5 text-muted-foreground/50" />
      </div>
      <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold shrink-0">
        {rank}
      </span>
      <span className="font-medium text-foreground flex-1">{option.text}</span>
    </div>
  );
}

export default function RankedChoiceInput({
  options,
  rankings,
  onChange,
  disabled,
}: RankedChoiceInputProps) {
  // Initialize rankings if empty — start with options in their original order
  const [initialized, setInitialized] = useState(false);
  if (!initialized && rankings.length === 0 && options.length > 0) {
    onChange(options.map((o) => o.id));
    setInitialized(true);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderedOptions =
    rankings.length > 0
      ? rankings
          .map((id) => options.find((o) => o.id === id))
          .filter(Boolean) as RankedChoiceOption[]
      : options;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rankings.indexOf(active.id as string);
    const newIndex = rankings.indexOf(over.id as string);
    onChange(arrayMove(rankings, oldIndex, newIndex));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground text-center mb-3">
        Drag to reorder — #1 is your top choice
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedOptions.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <motion.div className="space-y-2" layout>
            {orderedOptions.map((option, i) => (
              <SortableItem
                key={option.id}
                option={option}
                rank={i + 1}
                disabled={disabled}
              />
            ))}
          </motion.div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
