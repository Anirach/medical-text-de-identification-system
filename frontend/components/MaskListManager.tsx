// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Upload, Download, Edit2, Check, X } from "lucide-react";
import type { MaskKeyword, EntityType } from "~backend/deid/types";

interface MaskListManagerProps {
  maskList: MaskKeyword[];
  setMaskList: (list: MaskKeyword[]) => void;
}

const ENTITY_TYPES: EntityType[] = ["PERSON", "DATE", "LOCATION", "ID", "CONTACT", "ORGANIZATION"];

export default function MaskListManager({ maskList, setMaskList }: MaskListManagerProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [newEntityType, setNewEntityType] = useState<EntityType>("PERSON");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editKeyword, setEditKeyword] = useState("");
  const [editEntityType, setEditEntityType] = useState<EntityType>("PERSON");
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("maskList");
    if (saved) {
      try {
        setMaskList(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load mask list:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("maskList", JSON.stringify(maskList));
  }, [maskList]);

  const handleAdd = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Keyword Required",
        description: "Please enter a keyword to add",
        variant: "destructive",
      });
      return;
    }

    setMaskList([...maskList, { keyword: newKeyword.trim(), entityType: newEntityType }]);
    setNewKeyword("");
    toast({
      title: "Keyword Added",
      description: `"${newKeyword}" added to mask list`,
    });
  };

  const handleRemove = (index: number) => {
    const removed = maskList[index];
    setMaskList(maskList.filter((_, i) => i !== index));
    toast({
      title: "Keyword Removed",
      description: `"${removed.keyword}" removed from mask list`,
    });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditKeyword(maskList[index].keyword);
    setEditEntityType(maskList[index].entityType);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const updated = [...maskList];
    updated[editingIndex] = { keyword: editKeyword.trim(), entityType: editEntityType };
    setMaskList(updated);
    setEditingIndex(null);
    toast({
      title: "Keyword Updated",
      description: "Mask list updated successfully",
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(maskList, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mask-list-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "Mask list downloaded successfully",
    });
  };

  const handleImport = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (!Array.isArray(imported)) {
          throw new Error("Invalid format");
        }

        const valid = imported.every(
          (item) => item.keyword && item.entityType && ENTITY_TYPES.includes(item.entityType)
        );

        if (!valid) {
          throw new Error("Invalid mask list format");
        }

        setMaskList(imported);
        toast({
          title: "Import Complete",
          description: `${imported.length} keywords imported`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid JSON format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Custom Mask List</span>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            <Label htmlFor="import-file" className="cursor-pointer">
              <Button size="sm" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                </span>
              </Button>
            </Label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <Select value={newEntityType} onValueChange={(v: string) => setNewEntityType(v as EntityType)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {maskList.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {maskList.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                {editingIndex === index ? (
                  <>
                    <Input
                      value={editKeyword}
                      onChange={(e) => setEditKeyword(e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={editEntityType}
                      onValueChange={(v: string) => setEditEntityType(v as EntityType)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{item.keyword}</span>
                    <span className="text-xs text-muted-foreground">{item.entityType}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(index)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRemove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {maskList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom keywords added yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
