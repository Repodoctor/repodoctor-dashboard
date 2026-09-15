import type { Finding, Workspace, Repository } from '../interfaces/api';
import type { DataTableColumn } from '../components/data-table/data-table.types';

export function workspaceColumns(showActions = false): DataTableColumn<Workspace>[] {
  const cols: DataTableColumn<Workspace>[] = [
    { key: 'name', header: 'Name', value: (org) => org.name, mobile: 'title' },
    { key: 'slug', header: 'Slug', type: 'mono', value: (org) => org.slug, mobile: 'meta' },
    { key: 'role', header: 'Role', type: 'accent', value: (org) => org.role ?? '', mobile: 'meta' },
  ];
  if (showActions) {
    cols.push({
      key: 'actions',
      header: '',
      type: 'custom',
      sortable: false,
      align: 'end',
      mobile: false,
    });
  }
  return cols;
}

export function findingColumns(
  repoName: (finding: Finding) => string,
): DataTableColumn<Finding>[] {
  return [
    {
      key: 'repository',
      header: 'Repository',
      type: 'mono',
      value: (finding) => repoName(finding),
      mobile: false,
    },
    {
      key: 'title',
      header: 'Finding',
      type: 'subtitle',
      value: (finding) => finding.title,
      subtitle: (finding) => finding.description,
      mobile: 'title',
    },
    {
      key: 'severity',
      header: 'Severity',
      type: 'accent',
      value: (finding) => finding.severity,
      mobile: 'meta',
    },
    {
      key: 'file',
      header: 'File',
      type: 'mono',
      value: (finding) =>
        finding.filePath
          ? `${finding.filePath}${finding.lineNumber ? ':' + finding.lineNumber : ''}`
          : '—',
      sortValue: (finding) => finding.filePath ?? '',
      mobile: 'detail',
    },
    {
      key: 'status',
      header: 'Status',
      type: 'mono',
      value: (finding) => finding.status,
      mobile: false,
    },
  ];
}

export function repositoryColumns(
  codeCount: (repositoryId: string) => number,
  supplyChainCount: (repositoryId: string) => number,
): DataTableColumn<Repository>[] {
  return [
    {
      key: 'name',
      header: 'Repo name',
      value: (repo) => repo.name,
      mobile: 'title',
    },
    {
      key: 'owner',
      header: 'Organization',
      type: 'mono',
      value: (repo) => repo.owner,
      mobile: 'meta',
    },
    {
      key: 'workspaceName',
      header: 'Workspace',
      value: (repo) => repo.workspaceName ?? 'Workspace',
      mobile: 'meta',
    },
    {
      key: 'branch',
      header: 'Branch',
      type: 'mono',
      value: (repo) => repo.defaultBranch,
      mobile: false,
    },
    {
      key: 'visibility',
      header: 'Visibility',
      type: 'mono',
      value: (repo) => (repo.private ? 'private' : 'public'),
      mobile: false,
    },
    {
      key: 'lastScan',
      header: 'Last scan',
      type: 'date',
      value: (repo) => repo.lastAnalyzedAt ?? null,
      emptyLabel: 'Never',
      mobile: 'detail',
    },
    {
      key: 'codeFindings',
      header: 'Code findings',
      type: 'custom',
      sortValue: (repo) => codeCount(repo.id),
      mobile: false,
    },
    {
      key: 'supplyChainFindings',
      header: 'Supply chain findings',
      type: 'custom',
      sortValue: (repo) => supplyChainCount(repo.id),
      mobile: false,
    },
    {
      key: 'scannedDependencies',
      header: 'Scanned dependencies',
      type: 'mono',
      value: (repo) => (repo.lastAnalyzedAt ? '0' : '—'),
      sortValue: (repo) => (repo.lastAnalyzedAt ? 0 : -1),
      mobile: false,
    },
  ];
}
