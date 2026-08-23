import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 520);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <button type="button" className={`back-to-top ${visible ? "is-visible" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Kembali ke atas" aria-hidden={!visible} tabIndex={visible ? 0 : -1}>
      <ArrowUp size={17} />
      <span>Ke atas</span>
    </button>
  );
}
