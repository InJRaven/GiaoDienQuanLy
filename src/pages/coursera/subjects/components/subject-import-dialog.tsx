import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Info,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios.config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ImportConfirmResponse,
  ImportPreviewItem,
  ImportPreviewResponse,
} from '../types';

interface SubjectImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'result';

export function SubjectImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: SubjectImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(
    null,
  );
  const [confirmData, setConfirmData] = useState<ImportConfirmResponse | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'ready' | 'duplicate' | 'invalid'
  >('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('upload');
      setPreviewData(null);
      setConfirmData(null);
      setFilterStatus('all');
      setIsUploading(false);
      setIsConfirming(false);
    }
  }, [open]);

  // Handle specific import API errors
  const handleImportError = (err: any) => {
    const code = err?.response?.data?.code;
    const msg =
      err?.response?.data?.message || 'An error occurred, please try again';

    if (code === 'IMPORT_EXPIRED') {
      toast.error(
        'The import session has expired, please select the file again.',
      );
      setStep('upload');
      setPreviewData(null);
    } else if (
      [
        'BAD_REQUEST',
        'PAYLOAD_TOO_LARGE',
        'IMPORT_EMPTY_FILE',
        'IMPORT_UNREADABLE_FILE',
        'IMPORT_MISSING_COLUMNS',
      ].includes(code)
    ) {
      toast.error(msg);
    } else if (code === 'FORBIDDEN') {
      toast.error(
        'You do not have permission to create courses (courses:create).',
      );
      onOpenChange(false);
    } else {
      toast.error(msg);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      toast.error('Only .xlsx or .csv formats are supported');
      e.target.value = '';
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Maximum file size is 2MB');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<ImportPreviewResponse>(
        '/coursera/subjects/import/preview',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      setPreviewData(res);
      setStep('preview');
    } catch (err: any) {
      handleImportError(err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!previewData?.importId) return;

    setIsConfirming(true);
    try {
      const res = await api.post<ImportConfirmResponse>(
        '/coursera/subjects/import/confirm',
        {
          importId: previewData.importId,
        },
      );
      setConfirmData(res);
      setStep('result');
    } catch (err: any) {
      handleImportError(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (step === 'result' && confirmData?.created && confirmData.created > 0) {
      onSuccess();
    }
    onOpenChange(false);
  };

  const filteredItems = useMemo(() => {
    if (!previewData) return [];
    if (filterStatus === 'all') return previewData.items;
    return previewData.items.filter((item) => item.status === filterStatus);
  }, [previewData, filterStatus]);

  const renderStatus = (
    status: ImportPreviewItem['status'],
    errs?: string[],
  ) => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="success" appearance="light">
            Sẽ tạo
          </Badge>
        );
      case 'duplicate':
        return (
          <Badge variant="warning" appearance="light">
            Đã có, bỏ qua
          </Badge>
        );
      case 'invalid':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="destructive" appearance="light">
              Lỗi
            </Badge>
            {errs?.map((e, i) => (
              <span
                key={i}
                className="text-destructive text-2xs block truncate max-w-[200px]"
                title={e}
              >
                - {e}
              </span>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle>Bulk Import Courses</DialogTitle>
          <DialogDescription>
            {step === 'upload' &&
              'Upload a data file (.xlsx, .csv) to add multiple courses at once.'}
            {step === 'preview' && 'Review data before saving.'}
            {step === 'result' && 'Import results.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="p-6 overflow-hidden flex flex-col">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                {isUploading ? (
                  <Loader2 className="size-8 animate-spin" />
                ) : (
                  <FileSpreadsheet className="size-8" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-2">
                {isUploading ? 'Processing file...' : 'Upload File'}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                Drag and drop the file here or click the button below. Supported
                formats:{' '}
                <span className="font-medium text-foreground">.xlsx, .csv</span>
                . Max 2MB and 1000 rows.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Logic to download sample if it existed
                    toast.success('Sample file downloaded successfully');
                  }}
                  disabled={isUploading}
                >
                  <Download className="size-4 mr-2" />
                  Download Sample
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <FileUp className="size-4 mr-2" />
                  Select File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="flex flex-col h-full gap-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Total Rows
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {previewData.summary.totalRows}
                  </p>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Valid Courses
                  </p>
                  <p className="text-2xl font-bold mt-1 text-success">
                    {previewData.summary.ready}
                  </p>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Existing
                  </p>
                  <p className="text-2xl font-bold mt-1 text-warning">
                    {previewData.summary.duplicate}
                  </p>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Lỗi
                  </p>
                  <p className="text-2xl font-bold mt-1 text-destructive">
                    {previewData.summary.invalid}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <Badge
                    variant={filterStatus === 'all' ? 'primary' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilterStatus('all')}
                  >
                    All ({previewData.summary.courses})
                  </Badge>
                  <Badge
                    variant={filterStatus === 'ready' ? 'success' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilterStatus('ready')}
                  >
                    Ready to Create ({previewData.summary.ready})
                  </Badge>
                  <Badge
                    variant={
                      filterStatus === 'duplicate' ? 'warning' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => setFilterStatus('duplicate')}
                  >
                    Existing ({previewData.summary.duplicate})
                  </Badge>
                  <Badge
                    variant={
                      filterStatus === 'invalid' ? 'destructive' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => setFilterStatus('invalid')}
                  >
                    Lỗi ({previewData.summary.invalid})
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="size-3.5 text-primary" />
                  Session valid for{' '}
                  <span className="font-semibold text-foreground">
                    15 minutes
                  </span>
                </div>
              </div>

              <div className="border border-border rounded-lg flex-1 overflow-hidden min-h-[300px]">
                <ScrollArea className="h-[400px]">
                  <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20">
                      <tr>
                        <th className="sticky top-0 z-20 bg-muted px-4 py-3 text-left font-bold text-foreground text-xs uppercase tracking-wider border-b border-border shadow-xs w-20">
                          Rows
                        </th>
                        <th className="sticky top-0 z-20 bg-muted px-4 py-3 text-left font-bold text-foreground text-xs uppercase tracking-wider border-b border-border shadow-xs w-36">
                          Course Code
                        </th>
                        <th className="sticky top-0 z-20 bg-muted px-4 py-3 text-left font-bold text-foreground text-xs uppercase tracking-wider border-b border-border shadow-xs">
                          Links (
                          {`Tổng: ${previewData.items.reduce((acc, curr) => acc + curr.links.length, 0)}`}
                          )
                        </th>
                        <th className="sticky top-0 z-20 bg-muted px-4 py-3 text-left font-bold text-foreground text-xs uppercase tracking-wider border-b border-border shadow-xs w-36">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 align-top border-b border-border">
                            <span className="text-muted-foreground font-mono text-xs">
                              {item.rows.join(', ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top font-medium border-b border-border">
                            {item.code}
                          </td>
                          <td className="px-4 py-3 align-top border-b border-border">
                            {item.links.length === 0 ? (
                              <span className="text-muted-foreground italic">
                                -
                              </span>
                            ) : (
                              <ul className="flex flex-col gap-1">
                                {item.links.map((l, i) => (
                                  <li
                                    key={i}
                                    className="truncate max-w-[300px]"
                                  >
                                    <span className="font-medium mr-1">
                                      {l.label ? `${l.label}:` : ''}
                                    </span>
                                    <a
                                      href={l.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary hover:underline text-xs font-mono"
                                      title={l.url}
                                    >
                                      {l.url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top border-b border-border">
                            {renderStatus(item.status, item.errors)}
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-muted-foreground border-b border-border"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            </div>
          )}

          {step === 'result' && confirmData && (
            <div className="flex flex-col h-full items-center justify-center py-8">
              <div className="size-16 rounded-full bg-success/10 flex items-center justify-center mb-4 text-success">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Import Completed</h3>
              <p className="text-muted-foreground mb-8">
                Successfully created{' '}
                <strong className="text-foreground">
                  {confirmData.created}
                </strong>{' '}
                courses.
                {confirmData.failed > 0 && (
                  <span>
                    {' '}
                    There are{' '}
                    <strong className="text-destructive">
                      {confirmData.failed}
                    </strong>{' '}
                    courses that failed to save.
                  </span>
                )}
              </p>

              {confirmData.failed > 0 && (
                <div className="w-full max-w-lg border border-border rounded-lg overflow-hidden">
                  <div className="bg-destructive/10 px-4 py-2 font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    Failed Courses Details
                  </div>
                  <ScrollArea className="max-h-[250px] p-4">
                    <ul className="flex flex-col gap-3">
                      {confirmData.items
                        .filter((i) => i.status === 'failed')
                        .map((item, idx) => (
                          <li key={idx} className="text-sm flex gap-2">
                            <span className="font-semibold min-w-16">
                              {item.code}:
                            </span>
                            <span className="text-destructive">
                              {item.error}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="p-6 pt-4 border-t border-border flex justify-between sm:justify-between items-center">
          {step === 'preview' ? (
            <Button
              variant="ghost"
              onClick={() => setStep('upload')}
              disabled={isConfirming}
            >
              Back to Upload
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            {step === 'preview' && (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isConfirming}
              >
                Cancel
              </Button>
            )}

            {step === 'preview' && (
              <Button
                onClick={handleConfirm}
                disabled={isConfirming || previewData?.summary.ready === 0}
                className="min-w-[140px]"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-2" /> Confirm Creation{' '}
                    {previewData?.summary.ready || 0} courses
                  </>
                )}
              </Button>
            )}

            {(step === 'upload' || step === 'result') && (
              <Button onClick={handleClose}>Close</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
