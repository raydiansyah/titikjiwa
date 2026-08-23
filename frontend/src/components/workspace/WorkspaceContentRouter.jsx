export function WorkspaceContentRouter({
  section,
  user,
  views,
}) {
  const {
    JournalView,
    CommunityView,
    LearningView,
    PsychologistView,
    AdminUsers,
    AdminView,
    ConsultationInbox,
    AiCompanion,
    PsychologistProfile,
    ArticleComposer,
    WorkspaceHeading,
    AdminHome,
    PsychologistHome,
    HomeWorkspace,
  } = views;

  if (section === "jurnal") return <JournalView />;
  if (section === "komunitas") return <CommunityView />;
  if (section === "belajar") return <LearningView />;
  if (section === "psikolog") return <PsychologistView />;
  if (section === "pengguna" && user.role === "admin") return <AdminUsers />;
  if (section === "moderasi" && user.role === "admin") return <AdminView />;
  if (section === "konsultasi" && user.role === "psikolog") return <ConsultationInbox />;
  if (section === "teman") return <AiCompanion />;
  if (section === "profil" && user.role === "psikolog") return <PsychologistProfile user={user} />;

  if (section === "artikel" && user.role === "psikolog") {
    return (
      <div className="workspace-content">
        <WorkspaceHeading
          eyebrow="Ruang menulis"
          title="Tulis panduan untuk semua."
          text="Bagikan insight profesionalmu dengan bahasa yang manusiawi."
        />
        <ArticleComposer />
      </div>
    );
  }

  if (user.role === "admin") return <AdminHome />;
  if (user.role === "psikolog") return <PsychologistHome user={user} />;
  return <HomeWorkspace user={user} />;
}
