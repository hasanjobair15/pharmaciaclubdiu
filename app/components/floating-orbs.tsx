/* Floating 3D parallax orbs — pure decoration, no JS. */
export default function FloatingOrbs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="pc-orb pc-orb-a left-[-6%] top-[10%] h-[420px] w-[420px] bg-gradient-to-br from-cyan-400/20 to-teal-300/15" />
      <div className="pc-orb pc-orb-b right-[-8%] top-[34%] h-[380px] w-[380px] bg-gradient-to-bl from-teal-400/18 to-cyan-300/14" />
      <div
        className="pc-orb pc-orb-a bottom-[-12%] left-[28%] h-[460px] w-[460px] bg-gradient-to-tr from-sky-400/16 to-cyan-500/14"
        style={{ animationDelay: "-9s" }}
      />
      <div
        className="pc-orb pc-orb-b bottom-[4%] right-[20%] h-[260px] w-[260px] bg-gradient-to-b from-teal-300/18 to-cyan-200/12"
        style={{ animationDelay: "-14s" }}
      />
    </div>
  );
}
