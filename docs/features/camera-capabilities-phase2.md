# Feature: camera-capabilities-phase2

Structured stab / Log / HLG / flash class + schema/`camera_features` alignment.

## Acceptance criteria

- ✅ `CameraFeatures` includes `log_video`, `hlg`, `photo_10bit`
- ✅ GSMArena parse seeds those flags from feature/video text
- ✅ `device.schema.json` documents `camera_features` + richer aggregates/scores
- ✅ UI: Stab + Flash columns; Pro video shows Log/HLG when known

## Tests

- Automated: yes — `cameraCapabilities.test.ts`
