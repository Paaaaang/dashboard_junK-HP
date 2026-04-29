import { useState, useCallback } from "react";
import type { CompanyRecord } from "../../../types/models";
import { cloneCompany } from "../../../constants";

export function useCompanyDrawerState() {
  const [draftCompany, setDraftCompany] = useState<CompanyRecord | null>(null);
  const [drawerEditMode, setDrawerEditMode] = useState(false);
  const [expandedDrawerGroups, setExpandedDrawerGroups] = useState<Set<string>>(
    new Set(),
  );
  const [drawerNotice, setDrawerNotice] = useState("");
  const [editModeSnapshot, setEditModeSnapshot] = useState<CompanyRecord | null>(null);
  const [drawerNameEditing, setDrawerNameEditing] = useState(false);
  const [drawerNameDraft, setDrawerNameDraft] = useState("");
  const [cancelConfirmPending, setCancelConfirmPending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [expandedSubCourses, setExpandedSubCourses] = useState<Set<string>>(
    new Set(),
  );
  const [addParticipantSubCourseId, setAddParticipantSubCourseId] = useState<
    string | null
  >(null);
  const [addParticipantDraft, setAddParticipantDraft] = useState("");

  const enterEditMode = useCallback(() => {
    setEditModeSnapshot(draftCompany ? cloneCompany(draftCompany) : null);
    setDrawerEditMode(true);
  }, [draftCompany]);

  const closeDrawer = useCallback(() => {
    setDraftCompany(null);
    setDrawerEditMode(false);
    setDrawerNotice("");
    setEditModeSnapshot(null);
    setDrawerNameEditing(false);
    setCancelConfirmPending(false);
    setExpandedSubCourses(new Set());
    setAddParticipantSubCourseId(null);
    setAddParticipantDraft("");
  }, []);

  return {
    draftCompany,
    setDraftCompany,
    drawerEditMode,
    setDrawerEditMode,
    expandedDrawerGroups,
    setExpandedDrawerGroups,
    drawerNotice,
    setDrawerNotice,
    editModeSnapshot,
    setEditModeSnapshot,
    drawerNameEditing,
    setDrawerNameEditing,
    drawerNameDraft,
    setDrawerNameDraft,
    cancelConfirmPending,
    setCancelConfirmPending,
    isClosing,
    setIsClosing,
    isSaving,
    setIsSaving,
    expandedSubCourses,
    setExpandedSubCourses,
    addParticipantSubCourseId,
    setAddParticipantSubCourseId,
    addParticipantDraft,
    setAddParticipantDraft,
    enterEditMode,
    closeDrawer,
  };
}
