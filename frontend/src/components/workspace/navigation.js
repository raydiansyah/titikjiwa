import { BookOpen, Flag, MessageCircle, PenLine, Sparkles, Stethoscope, UserRound, Users, Wind } from "lucide-react";

const MEMBER_ITEMS = [
  { id: "beranda", label: "Beranda", icon: Sparkles },
  { id: "jurnal", label: "Jurnal pribadi", icon: PenLine },
  { id: "komunitas", label: "Linimasa", icon: Users },
  { id: "teman", label: "Teman AI", icon: Wind },
  { id: "belajar", label: "Belajar", icon: BookOpen },
  { id: "psikolog", label: "Psikolog", icon: Stethoscope },
];

const PSYCHOLOGIST_ITEMS = [
  { id: "beranda", label: "Beranda", icon: Sparkles },
  { id: "konsultasi", label: "Konsultasi masuk", icon: MessageCircle },
  { id: "artikel", label: "Tulis artikel", icon: PenLine },
  { id: "profil", label: "Profil saya", icon: UserRound },
  { id: "teman", label: "Teman AI", icon: Wind },
  { id: "komunitas", label: "Linimasa", icon: Users },
  { id: "belajar", label: "Belajar", icon: BookOpen },
];

const ADMIN_ITEMS = [
  { id: "beranda", label: "Beranda", icon: Sparkles },
  { id: "moderasi", label: "Moderasi", icon: Flag },
  { id: "komunitas", label: "Linimasa", icon: Users },
  { id: "teman", label: "Teman AI", icon: Wind },
  { id: "belajar", label: "Belajar", icon: BookOpen },
  { id: "psikolog", label: "Psikolog", icon: Stethoscope },
  { id: "pengguna", label: "Pengguna", icon: UserRound },
];

export function getWorkspaceNavigation(role) {
  if (role === "admin") return ADMIN_ITEMS;
  if (role === "psikolog") return PSYCHOLOGIST_ITEMS;
  return MEMBER_ITEMS;
}

export function getWorkspaceRoleLabel(role) {
  return {
    member: "Ruang pribadi",
    admin: "Admin",
    psikolog: "Psikolog terverifikasi",
  }[role] || "Ruang pribadi";
}
