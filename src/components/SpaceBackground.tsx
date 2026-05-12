const SpaceBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    {/* Deep space gradient base */}
    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240_40%_4%)] via-[hsl(260_35%_6%)] to-[hsl(245_40%_4%)]" />

    {/* Nebula clouds */}
    <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[140px] opacity-40 bg-[hsl(270_90%_50%)] animate-pulse-slow" />
    <div className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] opacity-30 bg-[hsl(320_90%_55%)] animate-pulse-slow" style={{ animationDelay: "3s" }} />
    <div className="absolute top-[30%] right-[20%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 bg-[hsl(190_95%_55%)] animate-pulse-slow" style={{ animationDelay: "5s" }} />
    <div className="absolute bottom-[20%] left-[15%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 bg-[hsl(220_90%_60%)] animate-pulse-slow" style={{ animationDelay: "7s" }} />

    {/* Star layers */}
    <div className="absolute inset-0 bg-stars animate-twinkle" />
    <div className="absolute inset-0 bg-stars-far opacity-70" />

    {/* Vignette */}
    <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80" style={{ background: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, hsl(240 40% 3% / 0.6) 100%)" }} />
  </div>
);

export default SpaceBackground;
