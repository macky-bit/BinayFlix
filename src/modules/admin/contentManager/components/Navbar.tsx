export default function Navbar() {
  return (
    <nav
      style={{
        background:
          "linear-gradient(to right, #0a0718 0%, #180d38 45%, #3b1875 100%)",
        borderBottom: "1px solid rgba(124, 58, 237, 0.3)",
      }}
      className="sticky top-0 z-50 px-6 h-14 flex items-center"
    >
      <div className="hidden sm:flex flex-col gap-0.5">
        <span
          className="text-sm font-medium text-white"
          style={{ textShadow: "0 0 12px rgba(124, 58, 237, 0.5)" }}
        >
          Content Management
        </span>
        <div
          className="h-px w-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #7C3AED, transparent)",
          }}
        />
      </div>
    </nav>
  )
}
