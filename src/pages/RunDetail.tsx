import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { getRun, exportRunCsv } from "@/lib/api";
import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";

const RunDetail = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["run", runId],
    queryFn: async () => {
      if (!runId) throw new Error("No run ID provided");
      return getRun(runId);
    },
    enabled: !!runId,
  });

  const run = data?.run;

  const handleExport = async () => {
    if (!runId) return;
    
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

  const formatJson = (obj: any): string => {
    try {
      if (typeof obj === "string") {
        const parsed = JSON.parse(obj);
        return JSON.stringify(parsed, null, 2);
      }
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-destructive">Error Loading Run</h1>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Failed to load run details"}
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const shortId = run.id.substring(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to runs
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Run <span className="font-mono text-primary">{shortId}</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {new Date(run.createdAt).toLocaleString()}
              </p>
            </div>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {run.explain && run.explanation && (
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Sparkles className="w-5 h-5" />
                AI Explanation
              </CardTitle>
              <CardDescription>Natural language summary of findings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{run.explanation}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Findings</CardTitle>
            <CardDescription>
              {run.findings?.length || 0} issue{run.findings?.length !== 1 ? "s" : ""} detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!run.findings || run.findings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No findings</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Index</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Row Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {run.findings.map((finding, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">
                          {finding.index ?? idx}
                        </TableCell>
                        <TableCell className="font-medium">{finding.type}</TableCell>
                        <TableCell>{finding.reason}</TableCell>
                        <TableCell>
                          {finding.row ? (
                            <pre className="text-xs font-mono bg-muted p-2 rounded max-w-md overflow-x-auto">
                              {formatJson(finding.row)}
                            </pre>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RunDetail;
