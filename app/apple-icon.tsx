import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 84,
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        <div>DT</div>
        <div style={{ fontSize: 22, marginTop: 4, fontWeight: 500, letterSpacing: 1 }}>
          COURRIERS
        </div>
      </div>
    ),
    { ...size }
  )
}
