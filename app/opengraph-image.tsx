import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 85% 20%, rgba(236,168,214,0.22) 0%, rgba(236,168,214,0.06) 30%, rgba(236,168,214,0) 55%), radial-gradient(circle at 10% 90%, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0) 45%), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 100px 100px, 100px 100px",
          color: "#ffffff",
          fontFamily: "monospace",
        }}
      >
        {/* pink terminal-cursor accent, echoing the favicon */}
        <div
          style={{
            position: "absolute",
            top: 88,
            right: 96,
            width: 26,
            height: 40,
            backgroundColor: "#eca8d6",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 48, height: 2, background: "rgba(255,255,255,0.3)" }} />
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)" }}>
            SOC / Blue Team — Security Engineer Fresher
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Pham Minh Tuan
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "rgba(255,255,255,0.55)", marginTop: 24 }}>
          Blue Team mindset, log-driven detection.
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 56 }}>
          {["SIEM", "IR", "WAF", "Firewall"].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                padding: "10px 20px",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                fontSize: 20,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
