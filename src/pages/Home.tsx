import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { listRuns, createRunFromRows, createRunFromFile, exportRunCsv } from "@/lib/api";
import { FileUp, FileJson, Download, ExternalLink, Loader2 } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [explain, setExplain] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["runs"],
    queryFn: async ({ pageParam }) => {
      return listRuns(20, pageParam);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const runs = data?.pages.flatMap(page => page.runs) || [];

  const handleFileUpload = async () => {
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createRunFromFile(file, explain);
      toast({ title: "Run created successfully" });
      navigate(`/run/${result.runId}`);
    } catch (error) {
      toast({
        title: "Failed to create run",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJsonSubmit = async () => {
    if (!jsonText.trim()) {
      toast({ title: "No JSON provided", variant: "destructive" });
      return;
    }

    try {
      const rows = JSON.parse(jsonText);
      if (!Array.isArray(rows)) {
        throw new Error("JSON must be an array of rows");
      }

      setIsCreating(true);
      const result = await createRunFromRows(rows, explain);
      toast({ title: "Run created successfully" });
      navigate(`/run/${result.runId}`);
    } catch (error) {
      toast({
        title: "Failed to create run",
        description: error instanceof Error ? error.message : "Invalid JSON",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleExport = async (runId: string) => {
    try {
      await exportRunCsv(runId);
      toast({ title: "CSV exported successfully" });
    } catch (error) {
      toast({
        title: "Failed to export CSV",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
              FW
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">FinOps Watchtower</h1>
              <p className="text-sm text-muted-foreground">Financial operations monitoring and analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">New Analysis Run</CardTitle>
            <CardDescription>Upload a CSV file or paste JSON data to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="explain" 
                checked={explain} 
                onCheckedChange={(checked) => setExplain(checked as boolean)}
              />
              <label
                htmlFor="explain"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ask AI for natural-language explanation
              </label>
            </div>

            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload CSV
                </TabsTrigger>
                <TabsTrigger value="json">
                  <FileJson className="w-4 h-4 mr-2" />
                  Paste JSON
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Button 
                  onClick={handleFileUpload} 
                  disabled={!file || isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating run...
                    </>
                  ) : (
                    "Create run from file"
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="json" className="space-y-4">
                <Textarea
                  placeholder='[{"col1": "value1", "col2": "value2"}, ...]'
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                />
                <Button 
                  onClick={handleJsonSubmit}
                  disabled={!jsonText.trim() || isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating run...
                    </>
                  ) : (
                    "Create run from JSON"
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Recent Runs</CardTitle>
            <CardDescription>View and export your analysis runs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : runs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No runs yet</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Explain</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(run.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{run.source || "—"}</TableCell>
                        <TableCell>{run.rowCount || 0}</TableCell>
                        <TableCell>
                          {run.explain ? (
                            <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">Yes</Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {run.coverage && run.coverage.length > 0 ? (
                              run.coverage.map((key) => (
                                <Badge key={key} variant="outline" className="text-xs bg-primary/10 border-primary/30">
                                  {key}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/run/${run.id}`)}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Open
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExport(run.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {hasNextPage && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Home;
