interface FeedTabsProps {
  activeTab: "for_you" | "following";
  onChange: (tab: "for_you" | "following") => void;
}

const FeedTabs = ({ activeTab, onChange }: FeedTabsProps) => {
  return (
    <div className="flex items-center gap-6 px-2 mb-4 border-b border-slate-200">
      {(["for_you", "following"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`pb-3 text-sm font-bold relative transition-colors ${
            activeTab === tab
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab === "for_you" ? "For You" : "Following"}
          {activeTab === tab && (
            <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-emerald-500 rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default FeedTabs;
