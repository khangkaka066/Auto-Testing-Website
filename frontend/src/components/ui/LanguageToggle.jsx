import { useLanguage } from "../../context/LanguageContext";

export default function LanguageToggle({ className = "" }) {
  const { lang, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-1 rounded-full border border-slate-200 p-1 ${className}`}>
      <button
        onClick={() => setLanguage("en")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          lang === "en"
            ? "bg-orange-500 text-white"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("vi")}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          lang === "vi"
            ? "bg-orange-500 text-white"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        VI
      </button>
    </div>
  );
}
