import type { CameraModule } from "../../types/device";
import {
  cameraTypeLabel,
  formatCameraHardwareLines,
  meaningfulCameras,
} from "./cameraFormat";

type Props = {
  cameras: CameraModule[];
};

export function CameraSystemCell({ cameras }: Props) {
  const list = meaningfulCameras(cameras);
  if (list.length === 0) {
    return <span className="ll-muted">No deep camera data</span>;
  }
  return (
    <ul className="ll-cam-list">
      {list.map((cam, i) => {
        const lines = formatCameraHardwareLines(cam);
        return (
          <li key={`${cam.type}-${i}`} className="ll-cam-item">
            <span className="ll-cam-type">{cameraTypeLabel(cam.type)}</span>
            {lines.length > 0 ? (
              <ul className="ll-cam-spec-lines">
                {lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <span className="ll-cam-specs">—</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
