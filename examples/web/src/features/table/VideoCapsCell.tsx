import type { VideoCapabilities } from "../../types/device";
import { summarizeVideo } from "./cameraFormat";

type Props = {
  video: VideoCapabilities | null | undefined;
};

export function VideoCapsCell({ video }: Props) {
  const s = summarizeVideo(video);
  if (s.p1080 === "—" && s.p4k === "—" && s.features.length === 0) {
    return <span className="ll-muted">—</span>;
  }
  return (
    <div className="ll-video-caps">
      <div>{s.p1080}</div>
      <div>{s.p4k}</div>
      {s.features.length > 0 ? (
        <div className="ll-video-features">{s.features.join(" · ")}</div>
      ) : null}
    </div>
  );
}
