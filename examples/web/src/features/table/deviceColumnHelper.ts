import { createColumnHelper } from "@tanstack/react-table";
import type { Device } from "../../types/device";

export const deviceCol = createColumnHelper<Device>();
