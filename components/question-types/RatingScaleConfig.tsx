"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RatingScaleConfigProps {
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
}

export default function RatingScaleConfig({
  settings,
  onChange,
}: RatingScaleConfigProps) {
  const min = (settings.min as number) ?? 1;
  const max = (settings.max as number) ?? 5;
  const labels = (settings.labels as Record<string, string>) ?? {};

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-xl border border-border">
      <h4 className="text-sm font-semibold text-foreground">
        Rating Scale Settings
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Minimum</Label>
          <Input
            type="number"
            min={1}
            max={max - 1}
            value={min}
            onChange={(e) =>
              onChange({ ...settings, min: parseInt(e.target.value) || 1 })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Maximum</Label>
          <Input
            type="number"
            min={min + 1}
            max={10}
            value={max}
            onChange={(e) =>
              onChange({ ...settings, max: parseInt(e.target.value) || 5 })
            }
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">
            Low label (optional)
          </Label>
          <Input
            placeholder="e.g. Poor"
            value={labels[String(min)] || ""}
            onChange={(e) =>
              onChange({
                ...settings,
                labels: { ...labels, [String(min)]: e.target.value },
              })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">
            High label (optional)
          </Label>
          <Input
            placeholder="e.g. Excellent"
            value={labels[String(max)] || ""}
            onChange={(e) =>
              onChange({
                ...settings,
                labels: { ...labels, [String(max)]: e.target.value },
              })
            }
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
