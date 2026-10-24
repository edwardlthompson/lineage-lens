import { buildIdentityDeviceColumns } from "./buildDeviceColumnsIdentity";
import { buildMetaDeviceColumns } from "./buildDeviceColumnsMeta";
import { buildOpticsDeviceColumns } from "./buildDeviceColumnsOptics";

export function buildDeviceColumns({
  selectedIds,
  toggleSelected,
  onOpenDevice,
}: {
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  onOpenDevice?: (id: string) => void;
}) {
  return [
    ...buildIdentityDeviceColumns({ selectedIds, toggleSelected, onOpenDevice }),
    ...buildOpticsDeviceColumns(),
    ...buildMetaDeviceColumns(),
  ];
}
