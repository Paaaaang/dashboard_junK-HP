# Component Dependency Graph & Modifications

## Modified Components

### Company Page Deletion Feature
- **Component:** [CompanyManagementPage](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/companies/CompanyManagementPage.tsx)
  - **Role:** Main controller for Company management.
  - **Changes:**
    - Adds `pendingDeleteCompanyIds` state to track companies queued for deletion.
    - Adds a "Delete" action to the `FloatingActionBar`.
    - Implements a confirmation modal showing warning messages for Cascade delete side-effects.
    - Integrates store action `deleteCompanies`.
    - Passes `onDeleteCompany` callback to `CompanyDrawer`.
- **Component:** [CompanyDrawer](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/companies/CompanyDrawer.tsx)
  - **Role:** Sidebar drawer displaying details of a company.
  - **Changes:**
    - Adds Lucide `Trash2` icon to imports.
    - Adds `onDeleteCompany` to props.
    - Renders a "Delete" button in the `headerActions` section when not in edit mode.

### Participant Page Deletion Feature
- **Component:** [ParticipantsPage](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/participants/ParticipantsPage.tsx)
  - **Role:** Main controller for Participant management.
  - **Changes:**
    - Adds `pendingDeleteParticipantIds` state to track participants queued for deletion.
    - Adds a "Delete" action to the `FloatingActionBar`.
    - Implements a confirmation modal displaying warning messages.
    - Integrates store action `deleteParticipants`.
    - Passes `onDeleteParticipant` callback to `ParticipantDrawer`.
- **Component:** [ParticipantDrawer](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/participants/ParticipantDrawer.tsx)
  - **Role:** Sidebar drawer displaying details of a participant.
  - **Changes:**
    - Adds Lucide `Trash2` icon to imports.
    - Adds `onDelete` to props.
    - Renders a "Delete" button in the `headerActions` section when not in edit mode.

### Google Forms Approval Staging Feature
- **Component:** [ApplicationsPage](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/applications/ApplicationsPage.tsx)
  - **Role:** Approval staging dashboard for incoming form entries.
  - **Changes:**
    - New component replacing the placeholder for `/forms`.
    - Manages staging states (Pending, Approved, Rejected) and supports batch approvals/rejections.
    - Integrates manual insertion modals and inline modification drawers.
- **Component:** [ApplicationsTable](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/applications/ApplicationsTable.tsx)
  - **Role:** Data table displaying applicant credentials and action controls. Supports row-click to open details drawer.
- **Component:** [AddApplicationModal](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/applications/modals/AddApplicationModal.tsx)
  - **Role:** Input modal to manually register pending applications.
- **Component:** [ApplicationDrawer](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/pages/applications/ApplicationDrawer.tsx)
  - **Role:** Staging application details drawer allowing managers to fix applicant typos.
- **Store:** [useApplicationStore](file:///C:/Users/user/Desktop/dev/dashboard_junK-HP/src/stores/useApplicationStore.ts)
  - **Role:** Zustand store interfacing with `applications` table. Implements sequential transaction-like approvals (resolving companies/participants/enrollments on DB) and modification actions.


