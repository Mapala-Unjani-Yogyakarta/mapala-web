import { Avatar } from "@/components/ui";

/** Kartu orang (pengurus): foto bulat, nama, jabatan. */
export function PersonCard({
  name,
  role,
  nickname,
  meta,
  photo,
  size = 52,
}: {
  name: string;
  role: string;
  nickname?: string | null;
  meta?: string | null;
  photo?: string | null;
  size?: number;
}) {
  return (
    <div className="card lift flex items-center gap-4 p-4">
      <Avatar src={photo} name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{name}</p>
        {nickname && <p className="truncate text-xs text-muted">“{nickname}”</p>}
        <p className="truncate text-sm text-brand-700">{role}</p>
        {meta && <p className="text-xs text-muted">{meta}</p>}
      </div>
    </div>
  );
}
