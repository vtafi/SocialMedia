interface FeedTabsProps {
  activeTab: "for_you" | "following";
  onChange: (tab: "for_you" | "following") => void;
}

const FeedTabs = ({ activeTab, onChange }: FeedTabsProps) => {
  return (
    <div className="flex bg-slate-100 p-1 rounded-xl">
      {(["for_you", "following"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === tab
              ? "bg-white shadow-sm text-[#0F172A]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab === "for_you" ? "All Updates" : "Following"}
        </button>
      ))}
    </div>
  );
};

export default FeedTabs;
