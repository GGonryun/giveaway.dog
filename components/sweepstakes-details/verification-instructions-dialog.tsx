'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { TASK_VERIFICATION_REQUIREMENT, TaskSchema } from '@/lib/task/schemas';
import {
  getVerificationInstructions,
  VerificationInstruction
} from '@/lib/task/verification/instructions';
import {
  getProviderLink,
  getProviderLabel
} from '@/lib/task/verification/utils';
import { CompletionStatus } from '@prisma/client';
import { UserSchema } from '@/schemas/user';
import { TaskStatusBadge } from '@/lib/task/components/task-status-badge';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { updateTaskCompletionStatus } from '@/procedures/sweepstakes/update-task-completion-status';
import { toast } from 'sonner';
import { reverifyTaskCompletion } from '@/procedures/sweepstakes/reverify-task-completion';

const useUpdateTaskCompletionStatus = ({
  sweepstakesId
}: {
  sweepstakesId: string;
}) => {
  const router = useRouter();

  const procedure = useProcedure({
    action: updateTaskCompletionStatus,
    onSuccess: () => {
      toast.success('Task completion status updated');
      router.refresh();
    },
    onFailure: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });

  return {
    ...procedure,
    run: (input: {
      taskCompletionId: string;
      status: CompletionStatus;
      reason?: string;
    }) => procedure.run({ ...input, sweepstakesId })
  };
};

const useReverifyTaskCompletion = ({
  sweepstakesId
}: {
  sweepstakesId: string;
}) => {
  const router = useRouter();

  const procedure = useProcedure({
    action: reverifyTaskCompletion,
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success('Task completion re-verified successfully');
      } else {
        toast.error(`Re-verification failed: ${data.error}`);
      }
      router.refresh();
    },
    onFailure: (error) => {
      toast.error(`Failed to re-verify: ${error.message}`);
    }
  });

  return {
    ...procedure,
    run: (input: { taskCompletionId: string }) =>
      procedure.run({ ...input, sweepstakesId })
  };
};

interface VerificationInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskCompletionId: string;
  sweepstakesId: string;
  task: TaskSchema;
  user: Pick<UserSchema, 'name' | 'providers'>;
  currentStatus: CompletionStatus;
}

export function VerificationInstructionsDialog({
  open,
  onOpenChange,
  taskCompletionId,
  sweepstakesId,
  task,
  user,
  currentStatus
}: VerificationInstructionsDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const updateStatus = useUpdateTaskCompletionStatus({ sweepstakesId });
  const reverify = useReverifyTaskCompletion({ sweepstakesId });

  const profileUrl = getProviderLink(task.type, user.providers || []);
  const username = getProviderLabel(task.type, user.providers || []);
  const supportsAutoVerify =
    TASK_VERIFICATION_REQUIREMENT[task.type] === 'automatic';

  const instructions: VerificationInstruction | null =
    getVerificationInstructions({ task, user });

  const handleApprove = async () => {
    updateStatus.run({
      taskCompletionId,
      status: CompletionStatus.COMPLETED
    });
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setShowRejectionInput(true);
      return;
    }

    updateStatus.run({
      taskCompletionId,
      status: CompletionStatus.REJECTED,
      reason: rejectionReason
    });
    onOpenChange(false);
    setShowRejectionInput(false);
    setRejectionReason('');
  };

  const handleReverify = async () => {
    await reverify.run({
      taskCompletionId
    });
  };

  if (!instructions) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setShowRejectionInput(false);
          setRejectionReason('');
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {instructions.title}
            <TaskStatusBadge status={currentStatus} />
          </DialogTitle>
          <DialogDescription>{instructions.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-2">
          {profileUrl && (
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-primary"
                >
                  View {username}&apos;s profile
                </a>
              </AlertDescription>
            </Alert>
          )}

          {supportsAutoVerify && (
            <Alert>
              <RefreshCw className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>This task supports automatic verification</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReverify}
                  disabled={reverify.isLoading}
                >
                  {reverify.isLoading
                    ? 'Verifying...'
                    : 'Re-verify Automatically'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {instructions.steps.length ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Verification Steps:</h4>
              {instructions.steps.map((step) => (
                <div key={step.step} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {step.step}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{step.instruction}</p>
                    {step.note && (
                      <p className="text-xs text-muted-foreground italic">
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No manual verification is needed for this task.</p>
          )}

          {showRejectionInput && (
            <div>
              <Label htmlFor="rejection-reason">
                Rejection Reason (required)
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this entry is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={
              updateStatus.isLoading ||
              currentStatus === CompletionStatus.REJECTED
            }
          >
            <XCircle className="h-4 w-4 mr-2" />
            {showRejectionInput ? 'Confirm Reject' : 'Reject'}
          </Button>
          <Button
            variant="default"
            onClick={handleApprove}
            disabled={
              updateStatus.isLoading ||
              currentStatus === CompletionStatus.COMPLETED
            }
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
