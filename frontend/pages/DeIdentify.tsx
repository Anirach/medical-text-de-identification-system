// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy, Download, Sparkles } from "lucide-react";
import { useBackend } from "../hooks/useBackend";
import type { AnonymizationMethod, EntityType } from "~backend/deid/types";
import ConfigPanel from "../components/ConfigPanel";
import EntityDisplay from "../components/EntityDisplay";
import MaskListManager from "../components/MaskListManager";

export default function DeIdentify() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [entities, setEntities] = useState<any[]>([]);
  const [language, setLanguage] = useState("");
  const [statistics, setStatistics] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [method, setMethod] = useState<AnonymizationMethod>("mask");
  const [enabledTypes, setEnabledTypes] = useState<EntityType[]>([
    "PERSON",
    "DATE",
    "LOCATION",
    "ID",
    "CONTACT",
    "ORGANIZATION",
  ]);
  const [customMaskList, setCustomMaskList] = useState<any[]>([]);
  const [useLLM, setUseLLM] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();

  const handleProcess = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to de-identify",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = useLLM ? backend.deid.processWithLLM : backend.deid.process;
      const result = await endpoint({
        text: inputText,
        method,
        enabledEntityTypes: enabledTypes,
        customMaskList,
      });

      setOutputText(result.deidentifiedText);
      setEntities(result.entities);
      setLanguage(result.language);
      setStatistics(result.statistics);

      toast({
        title: "Processing Complete",
        description: `Found ${result.statistics.totalEntities} entities`,
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Failed",
        description: "An error occurred during processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    toast({
      title: "Copied",
      description: "De-identified text copied to clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deidentified-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Medical Text De-Identification</h1>
          <p className="text-muted-foreground">
            Automatically detect and anonymize PII/PHI in Thai and English medical texts
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ConfigPanel
              method={method}
              setMethod={setMethod}
              enabledTypes={enabledTypes}
              setEnabledTypes={setEnabledTypes}
              useLLM={useLLM}
              setUseLLM={setUseLLM}
            />
            
            <MaskListManager
              maskList={customMaskList}
              setMaskList={setCustomMaskList}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Input Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Enter medical text to de-identify..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  {language && (
                    <Badge variant="outline" className="mt-2">
                      Language: {language}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || !inputText.trim()}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {useLLM && <Sparkles className="mr-2 h-4 w-4" />}
                      Process Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {outputText && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>De-identified Text</span>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline" onClick={handleCopy}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={outputText}
                      readOnly
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                {entities.length > 0 && (
                  <EntityDisplay entities={entities} statistics={statistics} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
