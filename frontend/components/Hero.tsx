// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Globe, Lock } from "lucide-react";

export default function Hero() {
  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4 text-primary" />
            <span>HIPAA & PDPA Compliant</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Medical Text De-Identification
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automatically detect and anonymize personally identifiable information (PII) and
            protected health information (PHI) in Thai and English medical texts using advanced
            AI technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/deidentify">Start De-Identifying</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/batch">Batch Processing</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="space-y-2">
              <Zap className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Fast Processing</h3>
              <p className="text-sm text-muted-foreground">
                Regex + AI validation for accurate results in seconds
              </p>
            </div>
            <div className="space-y-2">
              <Globe className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Bilingual Support</h3>
              <p className="text-sm text-muted-foreground">
                Handles Thai, English, and mixed-language medical texts
              </p>
            </div>
            <div className="space-y-2">
              <Lock className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your data is processed securely and never stored
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
