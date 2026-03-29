import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateDef } from "./TemplatePicker";

interface PromotedFieldsProps {
  template: TemplateDef;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function PromotedFields({ template, values, onChange, disabled }: PromotedFieldsProps) {
  if (!template.attributes || template.attributes.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
      <div className="md:col-span-2">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: "var(--font-cinzel)" }}>
          Entity Details
        </h4>
      </div>
      {template.attributes.map((attr) => (
        <div key={attr} className="space-y-1.5">
          <Label htmlFor={`attr-${attr}`} className="text-xs uppercase tracking-wider text-muted-foreground">
            {attr}
          </Label>
          <Input
            id={`attr-${attr}`}
            placeholder={`Enter ${attr.toLowerCase()}...`}
            value={values[attr] || ""}
            onChange={(e) => onChange(attr, e.target.value)}
            disabled={disabled}
            className="h-9 text-sm bg-background/50"
          />
        </div>
      ))}
    </div>
  );
}
