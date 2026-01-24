import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5F2EB 0%, #E8E4DC 50%, #D4CFC5 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Decorative pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233D4F4F' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.5,
          }}
        />
        
        {/* Top decorative line */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 80,
            right: 80,
            height: 4,
            background: "linear-gradient(90deg, transparent, #B45A3C, #B45A3C, transparent)",
            borderRadius: 2,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          {/* Cornwall icon/emoji */}
          <div
            style={{
              fontSize: 80,
              marginBottom: 20,
            }}
          >
            🌊
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#3D4F4F",
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            People of Cornwall
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 28,
              color: "#5A6B6B",
              margin: "20px 0 0 0",
              fontStyle: "italic",
            }}
          >
            A Living Archive of Cornish Voices
          </p>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 40,
              padding: "16px 32px",
              background: "rgba(180, 90, 60, 0.1)",
              borderRadius: 12,
              border: "2px solid rgba(180, 90, 60, 0.3)",
            }}
          >
            <span style={{ fontSize: 24, color: "#3D4F4F" }}>📖</span>
            <span style={{ fontSize: 22, color: "#3D4F4F" }}>Stories</span>
            <span style={{ fontSize: 20, color: "#B45A3C" }}>•</span>
            <span style={{ fontSize: 24, color: "#3D4F4F" }}>📅</span>
            <span style={{ fontSize: 22, color: "#3D4F4F" }}>Events</span>
            <span style={{ fontSize: 20, color: "#B45A3C" }}>•</span>
            <span style={{ fontSize: 24, color: "#3D4F4F" }}>🗳️</span>
            <span style={{ fontSize: 22, color: "#3D4F4F" }}>Polls</span>
            <span style={{ fontSize: 20, color: "#B45A3C" }}>•</span>
            <span style={{ fontSize: 24, color: "#3D4F4F" }}>📷</span>
            <span style={{ fontSize: 22, color: "#3D4F4F" }}>History</span>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 80,
            right: 80,
            height: 4,
            background: "linear-gradient(90deg, transparent, #B45A3C, #B45A3C, transparent)",
            borderRadius: 2,
          }}
        />

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            fontSize: 20,
            color: "#5A6B6B",
          }}
        >
          peopleofcornwall.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
