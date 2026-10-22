import { createRoot, type Root } from "react-dom/client";
import { DeviceTable } from "./DeviceTable";

let root: Root | null = null;

export function mountDevicesApp(host: HTMLElement): void {
  if (!root) {
    root = createRoot(host);
  }
  root.render(<DeviceTable />);
}

export function unmountDevicesApp(): void {
  root?.unmount();
  root = null;
}
