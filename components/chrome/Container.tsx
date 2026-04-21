export function Container({
  children,
  variant = "wizard",
}: {
  children: React.ReactNode;
  variant?: "wizard" | "scroll";
}) {
  const maxW = variant === "wizard" ? "max-w-[440px]" : "max-w-[560px]";
  return (
    <div className={`w-full mx-auto ${maxW} px-4 md:px-0 py-8`}>
      {children}
    </div>
  );
}
