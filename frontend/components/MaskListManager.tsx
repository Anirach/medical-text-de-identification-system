import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
import { Plus, Trash2, Upload, Download, Edit2, Check, X, Loader2 } from "lucide-react";
import { useBackend } from "../hooks/useBackend";
import { useAuth } from "../contexts/AuthContext";
import type { MaskKeyword, EntityType } from "../client";

interface MaskListManagerProps {
  maskList: MaskKeyword[];
  setMaskList: (list: MaskKeyword[]) => void;
}

const ENTITY_TYPES: EntityType[] = ["PERSON", "DATE", "LOCATION", "ID", "CONTACT", "ORGANIZATION"];

export default function MaskListManager({ maskList, setMaskList }: MaskListManagerProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [newEntityType, setNewEntityType] = useState<EntityType>("PERSON");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editKeyword, setEditKeyword] = useState("");
  const [editEntityType, setEditEntityType] = useState<EntityType>("PERSON");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const backend = useBackend();
  const { user, isLoading: authLoading } = useAuth();
  const loadMaskListRef = useRef(false);
  const prevMaskListRef = useRef<string>('');

  const loadMaskList = async () => {
    if (!user) {
      setMaskList([]);
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (loadMaskListRef.current) return;
    
    loadMaskListRef.current = true;
    setIsLoading(true);
    try {
      const result = await backend.deid.listMaskKeywords();
      setMaskList(result.keywords || []);
    } catch (error: any) {
      console.error("Failed to load mask list:", error);
      // If unauthorized, user might not be logged in properly
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        // Don't show error, just use empty list
        setMaskList([]);
      } else {
        setMaskList([]);
        toast({
          title: "Load Failed",
          description: "Could not load mask keywords",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      loadMaskListRef.current = false;
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (user) {
      loadMaskList();
    } else {
      const saved = localStorage.getItem("maskList");
      if (saved) {
        try {
          setMaskList(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to load mask list:", error);
        }
      } else {
        setMaskList([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    // Only save if maskList actually changed and user is not logged in
    const currentMaskList = JSON.stringify(maskList);
    if (!user && maskList.length > 0 && prevMaskListRef.current !== currentMaskList) {
      localStorage.setItem("maskList", currentMaskList);
      prevMaskListRef.current = currentMaskList;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maskList, user]);

  const handleAdd = async () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Keyword Required",
        description: "Please enter a keyword to add",
        variant: "destructive",
      });
      return;
    }

    if (user) {
      setIsLoading(true);
      try {
        const result = await backend.deid.createMaskKeyword({
          keyword: newKeyword.trim(),
          entityType: newEntityType,
        });
        setMaskList([...maskList, result.keyword]);
        setNewKeyword("");
        toast({
          title: "Keyword Added",
          description: `"${newKeyword}" added to mask list`,
        });
      } catch (error) {
        console.error("Failed to add keyword:", error);
        toast({
          title: "Add Failed",
          description: "Could not add keyword",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setMaskList([...maskList, { keyword: newKeyword.trim(), entityType: newEntityType }]);
      setNewKeyword("");
      toast({
        title: "Keyword Added",
        description: `"${newKeyword}" added to mask list`,
      });
    }
  };

  const handleRemove = async (item: MaskKeyword, index: number) => {
    if (user && item.id) {
      setIsLoading(true);
      try {
        await backend.deid.deleteMaskKeyword({ id: item.id });
        setMaskList(maskList.filter((_, i) => i !== index));
        toast({
          title: "Keyword Removed",
          description: `"${item.keyword}" removed from mask list`,
        });
      } catch (error) {
        console.error("Failed to remove keyword:", error);
        toast({
          title: "Remove Failed",
          description: "Could not remove keyword",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setMaskList(maskList.filter((_, i) => i !== index));
      toast({
        title: "Keyword Removed",
        description: `"${item.keyword}" removed from mask list`,
      });
    }
  };

  const handleEdit = (item: MaskKeyword) => {
    setEditingId(item.id || null);
    setEditKeyword(item.keyword);
    setEditEntityType(item.entityType);
  };

  const handleSaveEdit = async () => {
    const item = maskList.find((m) => m.id === editingId);
    if (!item) return;

    if (user && item.id) {
      setIsLoading(true);
      try {
        await backend.deid.updateMaskKeyword({
          id: item.id,
          keyword: editKeyword.trim(),
          entityType: editEntityType,
        });
        setMaskList(
          maskList.map((m) =>
            m.id === editingId
              ? { ...m, keyword: editKeyword.trim(), entityType: editEntityType }
              : m
          )
        );
        setEditingId(null);
        toast({
          title: "Keyword Updated",
          description: "Mask list updated successfully",
        });
      } catch (error) {
        console.error("Failed to update keyword:", error);
        toast({
          title: "Update Failed",
          description: "Could not update keyword",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      const index = maskList.findIndex((m) => m === item);
      if (index !== -1) {
        const updated = [...maskList];
        updated[index] = { ...item, keyword: editKeyword.trim(), entityType: editEntityType };
        setMaskList(updated);
        setEditingId(null);
        toast({
          title: "Keyword Updated",
          description: "Mask list updated successfully",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
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

        setMaskList(imported.map(({ keyword, entityType }) => ({ keyword, entityType })));
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

  // Show loading only while actively checking auth
  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Mask List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Mask List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to save and manage your custom mask keywords
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Custom Mask List</span>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={handleExport} disabled={isLoading}>
              <Download className="h-4 w-4" />
            </Button>
            <Label htmlFor="import-file" className="cursor-pointer">
              <Button size="sm" variant="outline" asChild disabled={isLoading}>
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
                disabled={isLoading}
              />
            </div>
            <Select value={newEntityType} onValueChange={(v: string) => setNewEntityType(v as EntityType)} disabled={isLoading}>
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
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {maskList.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {maskList.map((item, index) => (
              <div key={item.id || index} className="flex items-center gap-2 p-2 border rounded">
                {editingId === (item.id || null) && editingId !== null ? (
                  <>
                    <Input
                      value={editKeyword}
                      onChange={(e) => setEditKeyword(e.target.value)}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Select
                      value={editEntityType}
                      onValueChange={(v: string) => setEditEntityType(v as EntityType)}
                      disabled={isLoading}
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
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isLoading}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isLoading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{item.keyword}</span>
                    <span className="text-xs text-muted-foreground">{item.entityType}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} disabled={isLoading}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRemove(item, index)} disabled={isLoading}>
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
