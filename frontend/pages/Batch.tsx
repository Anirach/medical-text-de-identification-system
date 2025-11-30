import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle, XCircle, Download, Trash2 } from "lucide-react";

interface BatchFile {
  name: string;
  status: "pending" | "processing" | "completed" | "error";
  entitiesFound?: number;
}

export default function Batch() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: BatchFile[] = Array.from(uploadedFiles).map((file) => ({
      name: file.name,
      status: "pending",
    }));

    setFiles([...files, ...newFiles]);
    
    toast({
      title: "Files Added",
      description: `${newFiles.length} file(s) added to queue`,
    });

    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          newFiles.some((nf) => nf.name === f.name)
            ? { ...f, status: "completed", entitiesFound: Math.floor(Math.random() * 20) + 5 }
            : f
        )
      );
    }, 2000);
  };

  const clearQueue = () => {
    setFiles([]);
    toast({
      title: "Queue Cleared",
      description: "All files removed from queue",
    });
  };

  const downloadAll = () => {
    toast({
      title: "Download Started",
      description: "Preparing de-identified files...",
    });
  };

  const completedCount = files.filter((f) => f.status === "completed").length;
  const totalEntities = files.reduce((sum, f) => sum + (f.entitiesFound || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Batch Processing</h1>
          <p className="text-muted-foreground">
            Process multiple medical text files at once (Mock Implementation)
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{files.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Entities Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEntities}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upload Files</span>
              <div className="space-x-2">
                {files.length > 0 && (
                  <>
                    <Button size="sm" variant="outline" onClick={downloadAll}>
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearQueue}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Queue
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                .txt, .doc, or .docx files
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".txt,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium mb-2">Processing Queue</h3>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        {file.entitiesFound !== undefined && (
                          <p className="text-sm text-muted-foreground">
                            {file.entitiesFound} entities found
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {file.status === "pending" && (
                        <Badge variant="outline">Pending</Badge>
                      )}
                      {file.status === "processing" && (
                        <Badge variant="outline">Processing...</Badge>
                      )}
                      {file.status === "completed" && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      {file.status === "error" && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is a mock implementation for demonstration purposes.
            Actual file processing functionality will be implemented in a future version.
          </p>
        </div>
      </div>
    </div>
  );
}
