/** Titikjiwa application composition: providers and route tree only. */
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
