interface SettingsPageProps {
  data?: any;
}

export const SettingsPage = ({}: SettingsPageProps) => {
  return (
    <main className="bg-[#13141b] min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-[28px] font-bold" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
          Settings
        </h1>
        <p className="text-[#818ca2] text-[14px] mt-4" style={{ fontFamily: "'Albert Sans', sans-serif" }}>
          Settings page - coming soon
        </p>
      </div>
    </main>
  );
};
