from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'frontend' / 'src'
source = (SRC / 'App.js').read_text(encoding='utf-8')


def extract_function(name: str) -> str:
    m = re.search(rf'(?m)^function\s+{re.escape(name)}\s*\(', source)
    if not m:
        raise RuntimeError(f'Function {name} not found')
    start = m.start()
    brace = source.find('{', m.end())
    if brace < 0:
        raise RuntimeError(f'Opening brace for {name} not found')
    depth = 0
    i = brace
    quote = None
    escaped = False
    line_comment = False
    block_comment = False
    while i < len(source):
        ch = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ''
        if line_comment:
            if ch == '\n': line_comment = False
            i += 1; continue
        if block_comment:
            if ch == '*' and nxt == '/': block_comment = False; i += 2; continue
            i += 1; continue
        if quote:
            if escaped: escaped = False; i += 1; continue
            if ch == '\\': escaped = True; i += 1; continue
            if ch == quote: quote = None
            i += 1; continue
        if ch == '/' and nxt == '/': line_comment = True; i += 2; continue
        if ch == '/' and nxt == '*': block_comment = True; i += 2; continue
        if ch in ('"', "'", '`'): quote = ch; i += 1; continue
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return source[start:i + 1]
        i += 1
    raise RuntimeError(f'Unclosed function {name}')


def export_fn(text: str, names):
    for name in names:
        text = re.sub(rf'(?m)^function\s+{re.escape(name)}\s*\(', f'export function {name}(', text, count=1)
    return text


def write(rel, content):
    path = SRC / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + '\n', encoding='utf-8')

write('app/ThemeProvider.jsx', '''import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, getPreferredTheme, persistTheme } from "@/lib/theme";
const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });
export function ThemeProvider({ children }) { const [theme, setTheme] = useState(getPreferredTheme); useEffect(() => { applyTheme(theme); persistTheme(theme); }, [theme]); const value = useMemo(() => ({ theme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") }), [theme]); return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>; }
export function useTheme() { return useContext(ThemeContext); }
''')
write('app/AuthProvider.jsx', '''import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) { const [state, setState] = useState({ loading: true, user: null }); useEffect(() => { api.get("/auth/me").then(({ data }) => setState({ loading: false, user: data })).catch(() => setState({ loading: false, user: null })); }, []); const value = useMemo(() => ({ ...state, login: async (payload) => { const { data } = await api.post("/auth/login", payload); setState({ loading: false, user: data.user }); return data.user; }, register: async (payload) => { const { data } = await api.post("/auth/register", payload); setState({ loading: false, user: data.user }); return data.user; }, logout: async () => { await api.post("/auth/logout").catch(() => {}); setState({ loading: false, user: null }); } }), [state]); return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; }
export function useAuth() { return useContext(AuthContext); }
''')
write('components/layout/Logo.jsx', '''import { Link } from "@tanstack/react-router";
export function Logo({ light = false }) { return <Link to="/" className={`brand-mark ${light ? "brand-mark-light" : ""}`} data-testid="brand-logo-link"><img src="/titikjiwa-logo.png" alt="Logo Titikjiwa" className="brand-logo-image" /><span className="brand-symbol brand-symbol-legacy"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" opacity="0.35" /><path d="M12 6c-3 0-5 2-5 5 0 2 1.5 3.5 3 4.5 1 0.7 2 1.5 2 2.5" /><path d="M12 6c3 0 5 2 5 5 0 2-1.5 3.5-3 4.5-1 0.7-2 1.5-2 2.5" /><circle cx="12" cy="10" r="1.5" fill="currentColor" /></svg></span><span>Titikjiwa</span></Link>; }
''')
public_header = export_fn(extract_function('PublicHeader'), ['PublicHeader'])
write('components/layout/PublicHeader.jsx', 'import { useState } from "react";\nimport { Link, useNavigate } from "@tanstack/react-router";\nimport { Menu, Moon, Search, Sun, UserRound, X } from "lucide-react";\nimport { useTheme } from "@/app/ThemeProvider";\nimport { Logo } from "./Logo";\n' + public_header)
back = export_fn(extract_function('BackToTopButton'), ['BackToTopButton'])
write('components/layout/BackToTopButton.jsx', 'import { useEffect, useState } from "react";\nimport { ArrowUp } from "lucide-react";\n' + back)
write('features/workspace/WorkspaceHeading.jsx', 'export function WorkspaceHeading({ eyebrow, title, text, action }) { return <div className="workspace-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>; }\n')
write('lib/audio.js', export_fn(extract_function('playChime'), ['playChime']))
write('lib/aura.js', 'import { toast } from "sonner";\n' + export_fn(extract_function('downloadAuraCard'), ['downloadAuraCard']))
write('features/wellness/crisis.js', 'export const CRISIS_PATTERN = /bunuh diri|ingin mati|pengen mati|mengakhiri hidup|akhiri hidup|menyakiti diri|melukai diri|self.?harm|sayat|gantung diri|tidak (ingin|mau) hidup|lebih baik (aku|saya) (mati|tidak ada)/i;\n')
footer = export_fn(extract_function('InfoFooter'), ['InfoFooter'])
write('components/layout/InfoFooter.jsx', 'import { Link } from "@tanstack/react-router";\nimport { ShieldCheck } from "lucide-react";\nimport { Logo } from "./Logo";\nconst APP_VERSION = process.env.REACT_APP_VERSION || "dev";\n' + footer)
landing_parts = [extract_function(n) for n in ['LandingPage', 'Feature', 'AudienceItem', 'ArticleTeaser']]
landing_parts[0] = export_fn(landing_parts[0], ['LandingPage'])
write('pages/LandingPage.jsx', 'import { useEffect, useRef, useState } from "react";\nimport { Link } from "@tanstack/react-router";\nimport { AnimatePresence, motion } from "framer-motion";\nimport { gsap } from "gsap";\nimport Lenis from "lenis";\nimport { ArrowRight, BookOpen, Check, HeartHandshake, LockKeyhole, ShieldCheck } from "lucide-react";\nimport { PublicHeader } from "@/components/layout/PublicHeader";\nimport { BackToTopButton } from "@/components/layout/BackToTopButton";\nimport { InfoFooter } from "@/components/layout/InfoFooter";\nconst MIND_STATES = ["Overthinking", "Burnout", "Dreshing", "Stress", "Calmness"];\n' + '\n\n'.join(landing_parts))
parts = [extract_function(n) for n in ['CustomCaptcha', 'AuthPage', 'InterviewPage', 'ResetPasswordPage']]
for idx, name in [(1,'AuthPage'),(2,'InterviewPage'),(3,'ResetPasswordPage')]: parts[idx] = export_fn(parts[idx], [name])
write('pages/AuthPages.jsx', 'import { useCallback, useEffect, useState } from "react";\nimport { Link, useNavigate } from "@tanstack/react-router";\nimport { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";\nimport { Input } from "@/components/ui/input";\nimport { Textarea } from "@/components/ui/textarea";\nimport { toast } from "sonner";\nimport { api, errorMessage } from "@/lib/api";\nimport { useAuth } from "@/app/AuthProvider";\nimport { Logo } from "@/components/layout/Logo";\n' + '\n\n'.join(parts))
learning = export_fn(extract_function('LearningView'), ['LearningView'])
write('features/learning/LearningView.jsx', 'import { useState } from "react";\nimport { useQuery } from "@tanstack/react-query";\nimport { ShieldCheck, Stethoscope, X } from "lucide-react";\nimport { api } from "@/lib/api";\nimport { WorkspaceHeading } from "@/features/workspace/WorkspaceHeading";\n' + learning)
psy_names = ['PsychologistView','ArticleComposer','ConsultationInbox','PsychologistHome','PsychologistProfile']
psy_parts = [export_fn(extract_function(n),[n]) for n in psy_names]
write('features/psychologist/PsychologistFeature.jsx', 'import { useEffect, useState } from "react";\nimport { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";\nimport { ArrowRight, Check, MessageCircle, PenLine, Send, ShieldCheck, Stethoscope, Timer, Users, X } from "lucide-react";\nimport { Input } from "@/components/ui/input";\nimport { Textarea } from "@/components/ui/textarea";\nimport { toast } from "sonner";\nimport { api, errorMessage } from "@/lib/api";\nimport { WorkspaceHeading } from "@/features/workspace/WorkspaceHeading";\n' + '\n\n'.join(psy_parts))
admin_names = ['CrisisAlerts','AdminHome','AdminPsychologists','AdminUsers','AdminView']
admin_parts = [export_fn(extract_function(n),[n]) for n in admin_names]
write('features/admin/AdminFeature.jsx', 'import { useState } from "react";\nimport { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";\nimport { CircleAlert, Flag, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";\nimport { Input } from "@/components/ui/input";\nimport { Textarea } from "@/components/ui/textarea";\nimport { toast } from "sonner";\nimport { api, errorMessage } from "@/lib/api";\nimport { useAuth } from "@/app/AuthProvider";\nimport { WorkspaceHeading } from "@/features/workspace/WorkspaceHeading";\nimport { ArticleComposer } from "@/features/psychologist/PsychologistFeature";\n' + '\n\n'.join(admin_parts))
ai = export_fn(extract_function('AiCompanion'), ['AiCompanion'])
write('features/ai/AiCompanion.jsx', 'import { useEffect, useRef, useState } from "react";\nimport { useQuery, useQueryClient } from "@tanstack/react-query";\nimport { Send, ShieldCheck, Volume2, VolumeX, Wind } from "lucide-react";\nimport { toast } from "sonner";\nimport { API, api } from "@/lib/api";\nimport { playChime } from "@/lib/audio";\nimport { CRISIS_PATTERN } from "@/features/wellness/crisis";\nimport { WorkspaceHeading } from "@/features/workspace/WorkspaceHeading";\n' + ai)
emergency = export_fn(extract_function('EmergencySOS'), ['EmergencySOS'])
write('features/emergency/EmergencySOS.jsx', 'import { useEffect, useState } from "react";\nimport { motion } from "framer-motion";\nimport { CircleAlert, X } from "lucide-react";\nimport { toast } from "sonner";\nimport { api, errorMessage } from "@/lib/api";\nimport { useAuth } from "@/app/AuthProvider";\n' + emergency)
info_names = ['KontakPage','InfoPage','FeaturesPage','TutorialPage','PrivacyPage','TermsPage']
info_parts = [export_fn(extract_function(n),[n]) for n in info_names]
write('pages/InfoPages.jsx', 'import { useState } from "react";\nimport { Link } from "@tanstack/react-router";\nimport { motion } from "framer-motion";\nimport { ArrowRight, Send } from "lucide-react";\nimport { Input } from "@/components/ui/input";\nimport { Textarea } from "@/components/ui/textarea";\nimport { toast } from "sonner";\nimport { PublicHeader } from "@/components/layout/PublicHeader";\nimport { InfoFooter } from "@/components/layout/InfoFooter";\n' + '\n\n'.join(info_parts))
journal_path = SRC / 'features/journal/JournalView.jsx'; journal = journal_path.read_text(encoding='utf-8'); journal = journal.replace('import { useAuraHistory, useCreateJournal, useGenerateWeeklyInsight, useJournals, useWeeklyInsights } from "./hooks";\n', 'import { useAuraHistory, useCreateJournal, useGenerateWeeklyInsight, useJournals, useWeeklyInsights } from "./hooks";\nimport { WorkspaceHeading } from "@/features/workspace/WorkspaceHeading";\n'); journal = re.sub(r'\nfunction WorkspaceHeading\([^\n]+\n', '\n', journal, count=1); journal_path.write_text(journal, encoding='utf-8')
community_path = SRC / 'features/community/CommunityView.jsx'; community = community_path.read_text(encoding='utf-8'); community = community.replace('import { useCommunityPosts, useCreateComment, useCreateCommunityPost, usePostComments, usePostReaction, useReportPost } from "./hooks";\n', 'import { useCommunityPosts, useCreateComment, useCreateCommunityPost, usePostComments, usePostReaction, useReportPost } from "./hooks";\nimport { WorkspaceHeading } from "@/features/workspace/WorkspaceHeading";\nimport { playChime } from "@/lib/audio";\n'); community = re.sub(r'\nfunction WorkspaceHeading\([^\n]+\n', '\n', community, count=1); community = re.sub(r'\nfunction playChime\([^\n]+\n', '\n', community, count=1); community_path.write_text(community, encoding='utf-8')
workspace = export_fn(extract_function('Workspace'), ['Workspace']); home = extract_function('HomeWorkspace')
workspace_content = '''function WorkspaceContent({ section, user }) { if (section === "jurnal") return <JournalView />; if (section === "komunitas") return <CommunityView />; if (section === "belajar") return <LearningView />; if (section === "psikolog") return <PsychologistView />; if (section === "pengguna" && user.role === "admin") return <AdminUsers />; if (section === "moderasi" && user.role === "admin") return <AdminView />; if (section === "konsultasi" && user.role === "psikolog") return <ConsultationInbox />; if (section === "teman") return <AiCompanion />; if (section === "profil" && user.role === "psikolog") return <PsychologistProfile user={user} />; if (section === "artikel" && user.role === "psikolog") return <div className="workspace-content"><WorkspaceHeading eyebrow="Ruang menulis" title="Tulis panduan untuk semua." text="Bagikan insight profesionalmu dengan bahasa yang manusiawi." /><ArticleComposer /></div>; return user.role === "admin" ? <AdminHome /> : user.role === "psikolog" ? <PsychologistHome user={user} /> : <HomeWorkspace user={user} />; }'''
write('features/workspace/Workspace.jsx', 'import { useEffect, useState } from "react";\nimport { useQuery } from "@tanstack/react-query";\nimport { useNavigate } from "@tanstack/react-router";\nimport { ArrowRight, Bell, BookOpen, CircleAlert, Download, Flag, HeartHandshake, LogOut, MessageCircle, PenLine, ShieldCheck, Sparkles, Stethoscope, UserRound, Users, Wind } from "lucide-react";\nimport { api } from "@/lib/api";\nimport { downloadAuraCard } from "@/lib/aura";\nimport { todayPrompt } from "@/features/wellness/prompts";\nimport { useAuth } from "@/app/AuthProvider";\nimport { Logo } from "@/components/layout/Logo";\nimport { BackToTopButton } from "@/components/layout/BackToTopButton";\nimport { WorkspaceHeading } from "./WorkspaceHeading";\nimport { JournalView } from "@/features/journal/JournalView";\nimport { CommunityView } from "@/features/community/CommunityView";\nimport { LearningView } from "@/features/learning/LearningView";\nimport { AiCompanion } from "@/features/ai/AiCompanion";\nimport { EmergencySOS } from "@/features/emergency/EmergencySOS";\nimport { PsychologistView, ArticleComposer, ConsultationInbox, PsychologistHome, PsychologistProfile } from "@/features/psychologist/PsychologistFeature";\nimport { AdminHome, AdminUsers, AdminView } from "@/features/admin/AdminFeature";\n' + workspace + '\n\n' + workspace_content + '\n\n' + home)
write('App.js', '''/** Titikjiwa application composition: providers and route tree only. */
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/app/ThemeProvider";
import { AuthProvider } from "@/app/AuthProvider";
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage, InterviewPage, ResetPasswordPage } from "@/pages/AuthPages";
import { FeaturesPage, TutorialPage, PrivacyPage, TermsPage, KontakPage } from "@/pages/InfoPages";
import { Workspace } from "@/features/workspace/Workspace";
import "@/App.css";
import "@/hero-canvas.css";
import "@/contact.css";
function Root() { return <ThemeProvider><MotionConfig reducedMotion="user"><AuthProvider><Outlet /><Toaster position="top-right" richColors /></AuthProvider></MotionConfig></ThemeProvider>; }
const rootRoute = createRootRoute({ component: Root });
const routes = [createRoute({ getParentRoute: () => rootRoute, path: "/", component: LandingPage }), createRoute({ getParentRoute: () => rootRoute, path: "/masuk", component: AuthPage }), createRoute({ getParentRoute: () => rootRoute, path: "/ruang", component: Workspace }), createRoute({ getParentRoute: () => rootRoute, path: "/atur-ulang", component: ResetPasswordPage }), createRoute({ getParentRoute: () => rootRoute, path: "/wawancara", component: InterviewPage }), createRoute({ getParentRoute: () => rootRoute, path: "/fitur", component: FeaturesPage }), createRoute({ getParentRoute: () => rootRoute, path: "/tutorial", component: TutorialPage }), createRoute({ getParentRoute: () => rootRoute, path: "/privasi", component: PrivacyPage }), createRoute({ getParentRoute: () => rootRoute, path: "/syarat", component: TermsPage }), createRoute({ getParentRoute: () => rootRoute, path: "/kontak", component: KontakPage })];
const router = createRouter({ routeTree: rootRoute.addChildren(routes) });
export default function App() { return <RouterProvider router={router} />; }
''')
for rel in ['scripts/modularize_app.py', '.github/workflows/modularize-app.yml']:
    p = ROOT / rel
    if p.exists(): p.unlink()
