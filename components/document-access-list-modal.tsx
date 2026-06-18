'use client';

import { Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Loader } from '@/components/ui/loader';
import { useDocumentAccessList } from '@/hooks/use-dms';

type Props = {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DocumentAccessListModal({ documentId, documentTitle, open, onOpenChange }: Props) {
  const { data: members = [], isLoading } = useDocumentAccessList(documentId, { enabled: open });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="People with access"
      description={`Teammates you allow-listed for "${documentTitle}". They can always open and download it.`}
      size="md"
    >
      {isLoading ? (
        <Loader text="Loading access list..." />
      ) : members.length === 0 ? (
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
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-subtle text-sm font-medium text-primary">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} className="size-full object-cover" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{member.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
