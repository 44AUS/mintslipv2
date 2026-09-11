import BannedScreen from "@/components/BannedScreen";

// Direct /banned visits render the screen standalone (opaque red wash).
// Inside /app the same screen overlays the live app with the paywall-style
// backdrop blur — see AppLayout's ban check.
export default function Banned() {
  return <BannedScreen />;
}
