import React from "react";

export function OtpSpamHint() {
  const [shrunk, setShrunk] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => setShrunk(true), 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <p
      className={`text-center text-muted-foreground transition-[font-size] duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] 
        ${shrunk ? "text-xs" : "text-sm"}`}
      style={{ willChange: "font-size" }}
    >
      Please check your{" "}
      <span className="font-bold text-orange-500">spam</span> folder and click not spam
    </p>
  );
}
