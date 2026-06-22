'use client';

import * as React from 'react';
import { Users, UserMinus, UserPlus, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { DeleteConfirmation } from '@/components/delete-confirmation';
import {
  useDocumentAccessList,
  useAddDocumentAccess,
  useRevokeDocumentAccess,
  useUsers,
} from '@/hooks/use-dms';
import type { UserOption } from '@/types/dms';

type Props = {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function MemberAvatar({ member }: { member: UserOption }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-subtle text-sm font-medium text-primary">
      {member.imageUrl ? (
        <img src={member.imageUrl} alt={member.name} className="size-full object-cover" />
      ) : (
        member.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export function DocumentAccessListModal({ documentId, documentTitle, open, onOpenChange }: Props) {
  const { data, isLoading } = useDocumentAccessList(documentId, { enabled: open });
  const scope = data?.scope ?? 'allow-list';
  const members = data?.members ?? [];

  const addAccess = useAddDocumentAccess(documentId);
  const revoke = useRevokeDocumentAccess(documentId);
  const { data: teamMembers = [] } = useUsers();

  const [pendingRevoke, setPendingRevoke] = React.useState<UserOption | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [selectedToAdd, setSelectedToAdd] = React.useState<string[]>([]);

  // Teammates not already on the allow list — the candidates the uploader can add.
  const memberIds = React.useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const candidates = teamMembers.filter((m) => !memberIds.has(m.id));

  const closeAdd = () => {
    setIsAdding(false);
    setSelectedToAdd([]);
  };

  const toggleCandidate = (id: string) => {
    setSelectedToAdd((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    if (selectedToAdd.length === 0) return;
    addAccess.mutate(selectedToAdd, {
      onSuccess: () => {
        toast.success(
          selectedToAdd.length === 1 ? 'Added 1 person.' : `Added ${selectedToAdd.length} people.`,
        );
        closeAdd();
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Could not add people.');
      },
    });
  };

  const handleConfirmRevoke = () => {
    if (!pendingRevoke) return;
    const target = pendingRevoke;
    revoke.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Removed ${target.name}'s access.`);
        setPendingRevoke(null);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Could not revoke access.');
      },
    });
  };

  const description =
    scope === 'everyone'
      ? `"${documentTitle}" isn't restricted, so everyone on the team can open and download it.`
      : `Teammates you allow-listed for "${documentTitle}". They can always open and download it.`;

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="People with access"
        description={description}
        size="md"
      >
        {isLoading ? (
          <Loader text="Loading access list..." />
        ) : (
          <div className="space-y-3">
            {scope === 'everyone' ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <Globe className="size-4 shrink-0 text-primary" />
                Everyone on the team has access. Move this document into a sensitive folder or mark
                it sensitive to limit who can see it.
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {members.length} {members.length === 1 ? 'person has' : 'people have'} access
                </span>
                {!isAdding && candidates.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setIsAdding(true)}
                  >
                    <UserPlus className="size-4" />
                    Add people
                  </Button>
                )}
              </div>
            )}

            {scope === 'allow-list' && isAdding && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Pick teammates to grant access. They&apos;ll always be able to open and download
                  this document.
                </p>
                {candidates.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    Everyone is already on the list.
                  </p>
                ) : (
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
                    {candidates.map((member) => (
                      <label
                        key={member.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToAdd.includes(member.id)}
                          onChange={() => toggleCandidate(member.id)}
                          className="size-4 accent-primary"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {member.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {member.email}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeAdd}
                    disabled={addAccess.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAdd}
                    disabled={addAccess.isPending || selectedToAdd.length === 0}
                  >
                    {addAccess.isPending
                      ? 'Adding...'
                      : `Add${selectedToAdd.length ? ` ${selectedToAdd.length}` : ''}`}
                  </Button>
                </div>
              </div>
            )}

            {members.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-background py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Users className="size-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No one was added to this document&apos;s allow list at upload.
                </p>
              </div>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-md border bg-background px-3 py-2"
                  >
                    <MemberAvatar member={member} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </span>
                    {scope === 'allow-list' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 gap-1.5 text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingRevoke(member)}
                        disabled={revoke.isPending}
                      >
                        <UserMinus className="size-4" />
                        Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>

      <DeleteConfirmation
        open={Boolean(pendingRevoke)}
        title="Revoke access?"
        description={
          pendingRevoke
            ? `${pendingRevoke.name} will lose access to "${documentTitle}" and can no longer open or download it.`
            : ''
        }
        confirmLabel="Revoke access"
        pendingLabel="Revoking..."
        isPending={revoke.isPending}
        onCancel={() => {
          if (!revoke.isPending) setPendingRevoke(null);
        }}
        onConfirm={handleConfirmRevoke}
      />
    </>
  );
}
