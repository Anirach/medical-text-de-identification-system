// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Entity } from "~backend/deid/types";

interface EntityDisplayProps {
  entities: Entity[];
  statistics: {
    totalEntities: number;
    byType: Record<string, number>;
  };
}

const ENTITY_COLORS: Record<string, string> = {
  PERSON: "bg-blue-500/10 text-blue-700 border-blue-200",
  DATE: "bg-green-500/10 text-green-700 border-green-200",
  LOCATION: "bg-purple-500/10 text-purple-700 border-purple-200",
  ID: "bg-orange-500/10 text-orange-700 border-orange-200",
  CONTACT: "bg-pink-500/10 text-pink-700 border-pink-200",
  ORGANIZATION: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
};

export default function EntityDisplay({ entities, statistics }: EntityDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Entities ({statistics.totalEntities})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(statistics.byType).map(([type, count]) => (
            count > 0 && (
              <div key={type} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{type}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            )
          ))}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {entities.map((entity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded text-sm"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge className={ENTITY_COLORS[entity.type] || ""}>
                  {entity.type}
                </Badge>
                <span className="font-mono truncate">{String(entity.text)}</span>
              </div>
              {entity.confidence && (
                <Badge variant="outline" className="ml-2 shrink-0">
                  {(entity.confidence * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
