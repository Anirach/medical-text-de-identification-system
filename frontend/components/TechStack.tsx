// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TechStack() {
  const features = [
    {
      title: "Entity Detection",
      items: [
        "6 Entity Types (Person, Date, Location, ID, Contact, Organization)",
        "Regex Pattern Matching",
        "Google Gemini 2.0 Flash LLM Validation",
        "Custom Mask List Support",
        "Confidence Scoring",
      ],
    },
    {
      title: "Anonymization Methods",
      items: [
        "Redact - Complete removal",
        "Mask - Replace with entity type",
        "Generalize - Entity type classification",
        "Pseudonymize - Unique identifiers",
      ],
    },
    {
      title: "Technical Features",
      items: [
        "Multi-byte Character Handling (Thai)",
        "Language Detection (Thai/English/Mixed)",
        "Position Normalization",
        "Batch Processing",
        "JSON Import/Export",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Features & Capabilities</h2>
          <p className="text-muted-foreground">
            Advanced de-identification powered by regex patterns and AI
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5 shrink-0">
                        ✓
                      </Badge>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Compliance Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold mb-2">HIPAA (USA)</h4>
                <p className="text-sm text-muted-foreground">
                  Follows Safe Harbor method for PHI de-identification
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">PDPA (Thailand)</h4>
                <p className="text-sm text-muted-foreground">
                  Personal Data Protection Act compliance
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">GDPR (EU)</h4>
                <p className="text-sm text-muted-foreground">
                  Right to be forgotten and data minimization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
