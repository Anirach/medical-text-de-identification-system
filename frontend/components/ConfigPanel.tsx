import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { AnonymizationMethod, EntityType } from "../client";

interface ConfigPanelProps {
  method: AnonymizationMethod;
  setMethod: (method: AnonymizationMethod) => void;
  enabledTypes: EntityType[];
  setEnabledTypes: (types: EntityType[]) => void;
  useLLM: boolean;
  setUseLLM: (use: boolean) => void;
}

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "PERSON", label: "Person Names" },
  { value: "DATE", label: "Dates" },
  { value: "LOCATION", label: "Locations" },
  { value: "ID", label: "IDs & Numbers" },
  { value: "CONTACT", label: "Contact Info" },
  { value: "ORGANIZATION", label: "Organizations" },
];

export default function ConfigPanel({
  method,
  setMethod,
  enabledTypes,
  setEnabledTypes,
  useLLM,
  setUseLLM,
}: ConfigPanelProps) {
  const toggleEntityType = (type: EntityType) => {
    if (enabledTypes.includes(type)) {
      setEnabledTypes(enabledTypes.filter((t) => t !== type));
    } else {
      setEnabledTypes([...enabledTypes, type]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Anonymization Method</Label>
          <Select value={method} onValueChange={(v: string) => setMethod(v as AnonymizationMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="redact">Redact</SelectItem>
              <SelectItem value="mask">Mask</SelectItem>
              <SelectItem value="generalize">Generalize</SelectItem>
              <SelectItem value="pseudonymize">Pseudonymize</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {method === "redact" && "Removes entities completely ([REDACTED])"}
            {method === "mask" && "Replaces with entity type ([PERSON])"}
            {method === "generalize" && "Replaces with entity type ([LOCATION])"}
            {method === "pseudonymize" && "Generates unique IDs ([PERSON_a3k9j2])"}
          </p>
        </div>

        <div className="space-y-3">
          <Label>Entity Types to Detect</Label>
          {ENTITY_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={enabledTypes.includes(type.value)}
                onCheckedChange={() => toggleEntityType(type.value)}
              />
              <Label htmlFor={type.value} className="font-normal cursor-pointer">
                {type.label}
              </Label>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
          <Label htmlFor="llm-mode" className="cursor-pointer">
            Use AI Validation
          </Label>
          <Switch
            id="llm-mode"
            checked={useLLM}
            onCheckedChange={setUseLLM}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enable Google Gemini for enhanced accuracy (requires API key)
        </p>
      </CardContent>
    </Card>
  );
}
