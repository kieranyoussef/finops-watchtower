const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
const SECRET = import.meta.env.VITE_WATCHTOWER_SECRET || 'dev-secret';

interface Run {
  id: string;
  createdAt: string;
  source?: string;
  rowCount?: number;
  explain?: boolean;
  coverage?: string[];
  explanation?: string;
  findings?: Finding[];
}

interface Finding {
  index?: number;
  type: string;
  reason: string;
  row?: any;
}

interface ListRunsResponse {
  ok: boolean;
  nextCursor?: string;
  runs: Run[];
}

interface GetRunResponse {
  ok: boolean;
  run: Run;
}

interface CreateRunResponse {
  ok: boolean;
  runId: string;
}

function getHeaders(): HeadersInit {
  return {
    'x-watchtower-secret': SECRET,
  };
}

export async function listRuns(limit?: number, cursor?: string): Promise<ListRunsResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (cursor) params.append('cursor', cursor);
  
  const url = `${API_URL}/runs${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list runs: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getRun(runId: string): Promise<GetRunResponse> {
  const response = await fetch(`${API_URL}/runs/${runId}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get run: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createRunFromRows(rows: any[], explain?: boolean): Promise<CreateRunResponse> {
  const response = await fetch(`${API_URL}/run`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rows, explain }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create run: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createRunFromFile(file: File, explain?: boolean): Promise<CreateRunResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (explain !== undefined) {
    formData.append('explain', explain.toString());
  }
  
  const response = await fetch(`${API_URL}/run`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create run from file: ${response.statusText}`);
  }
  
  return response.json();
}

export async function exportRunCsv(runId: string): Promise<void> {
  const response = await fetch(`${API_URL}/runs/${runId}/export.csv`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to export CSV: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `run-${runId}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export type { Run, Finding, ListRunsResponse, GetRunResponse, CreateRunResponse };
