import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { useTaskStore } from "../store";
import { DEFAULT_BOARD, DEFAULT_PRESET_LABELS, isUnintendedSeedTaskList } from "../seed";

export const getUserStorageKey = (uid: string) => `taskflow_user_${uid}`;

export function useFirestoreSync(): void {
  const { user } = useAuth();
  const setSyncStatus = useTaskStore((s) => s.setSyncStatus);
  const setIsDataLoaded = useTaskStore((s) => s.setIsDataLoaded);
  const loadUserData = useTaskStore((s) => s.loadUserData);

  const isLoadedRef = useRef(false);
  const lastSavedJsonRef = useRef("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      isLoadedRef.current = false;
      lastSavedJsonRef.current = "";
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setSyncStatus("idle");
      setIsDataLoaded(false);
      return;
    }

    const uid = user.uid;
    const userDocRef = doc(db, "users", uid, "data", "workspace");
    const userStorageKey = getUserStorageKey(uid);
    let isCancelled = false;

    // 0. Pre-load from user-specific cache immediately if available (for fast offline startup)
    try {
      const localCached = localStorage.getItem(userStorageKey);
      if (localCached) {
        const parsed = JSON.parse(localCached);
        if (parsed && typeof parsed === "object") {
          // If cached data was poisoned with demo tasks in the past, clean it
          if (isUnintendedSeedTaskList(parsed.tasks)) {
            parsed.tasks = [];
          }
          loadUserData(parsed);
        }
      }
    } catch (e) {
      console.warn("TaskFlow: Error reading user offline cache", e);
    }

    // 1. Fetch user-specific data from Firestore
    const loadFromFirestore = async () => {
      setSyncStatus("saving");

      try {
        let snap = await getDoc(userDocRef);

        // Fallback check on root doc users/{uid} if subcollection doesn't exist yet
        if (!snap.exists()) {
          const rootDocRef = doc(db, "users", uid);
          const rootSnap = await getDoc(rootDocRef).catch(() => null);
          if (rootSnap && rootSnap.exists()) {
            snap = rootSnap;
          }
        }

        if (isCancelled) return;

        if (snap.exists()) {
          const data = snap.data();
          let tasks = Array.isArray(data.tasks) ? data.tasks : [];

          // Clean up unintended demo tasks if previously written to this user's cloud document
          let needsCleanCloudSync = false;
          if (isUnintendedSeedTaskList(tasks)) {
            tasks = [];
            needsCleanCloudSync = true;
          }

          const workspaceData = {
            boards:
              Array.isArray(data.boards) && data.boards.length > 0
                ? data.boards
                : [DEFAULT_BOARD],
            activeBoardId: data.activeBoardId || DEFAULT_BOARD.id,
            tasks,
            availableLabels:
              Array.isArray(data.availableLabels) && data.availableLabels.length > 0
                ? data.availableLabels
                : DEFAULT_PRESET_LABELS,
            themeMode: data.themeMode,
            mode: data.mode,
            accentColor: data.accentColor,
            density: data.density,
            language: data.language,
            notificationSettings: data.notificationSettings,
          };

          loadUserData(workspaceData);

          // Update user-scoped offline cache
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(workspaceData));
          } catch {
            // ignore
          }

          const payload = {
            boards: workspaceData.boards,
            activeBoardId: workspaceData.activeBoardId,
            tasks: workspaceData.tasks,
            availableLabels: workspaceData.availableLabels,
            themeMode: workspaceData.themeMode,
            mode: workspaceData.mode,
            accentColor: workspaceData.accentColor,
            density: workspaceData.density,
            language: workspaceData.language,
            notificationSettings: workspaceData.notificationSettings,
          };
          lastSavedJsonRef.current = JSON.stringify(payload);

          if (needsCleanCloudSync) {
            await setDoc(userDocRef, { ...payload, updatedAt: Date.now() }, { merge: true });
          }

          setSyncStatus("saved");
        } else {
          // Brand new user: initialize with clean, EMPTY workspace (never static demo tasks)
          const state = useTaskStore.getState();
          const initialData = {
            boards: [DEFAULT_BOARD],
            activeBoardId: DEFAULT_BOARD.id,
            tasks: [],
            availableLabels: DEFAULT_PRESET_LABELS,
            themeMode: state.themeMode,
            mode: state.mode,
            accentColor: state.accentColor,
            density: state.density,
            language: state.language,
            notificationSettings: state.notificationSettings,
            updatedAt: Date.now(),
          };

          loadUserData(initialData);

          try {
            localStorage.setItem(userStorageKey, JSON.stringify(initialData));
          } catch {
            // ignore
          }

          const sanitized = JSON.parse(JSON.stringify(initialData));
          await setDoc(userDocRef, sanitized, { merge: true });

          lastSavedJsonRef.current = JSON.stringify({
            boards: initialData.boards,
            activeBoardId: initialData.activeBoardId,
            tasks: initialData.tasks,
            availableLabels: initialData.availableLabels,
            themeMode: initialData.themeMode,
            mode: initialData.mode,
            accentColor: initialData.accentColor,
            density: initialData.density,
            language: initialData.language,
            notificationSettings: initialData.notificationSettings,
          });
          setSyncStatus("saved");
        }
      } catch (error) {
        console.warn("TaskFlow: Could not load data from Firestore, using offline fallback", error);
        if (isCancelled) return;
        setSyncStatus("error");
      } finally {
        if (!isCancelled) {
          isLoadedRef.current = true;
          setIsDataLoaded(true);
        }
      }
    };

    void loadFromFirestore();

    // 2. Subscribe to store changes, update user-scoped cache immediately, and debounce Firestore save
    const unsubscribe = useTaskStore.subscribe((state, prevState) => {
      if (!isLoadedRef.current || isCancelled) return;

      const syncedChanged =
        state.boards !== prevState.boards ||
        state.activeBoardId !== prevState.activeBoardId ||
        state.tasks !== prevState.tasks ||
        state.availableLabels !== prevState.availableLabels ||
        state.themeMode !== prevState.themeMode ||
        state.mode !== prevState.mode ||
        state.accentColor !== prevState.accentColor ||
        state.density !== prevState.density ||
        state.language !== prevState.language ||
        state.notificationSettings !== prevState.notificationSettings;
      if (!syncedChanged) return;

      const payload = {
        boards: state.boards,
        activeBoardId: state.activeBoardId,
        tasks: state.tasks,
        availableLabels: state.availableLabels,
        themeMode: state.themeMode,
        mode: state.mode,
        accentColor: state.accentColor,
        density: state.density,
        language: state.language,
        notificationSettings: state.notificationSettings,
      };

      const currentJson = JSON.stringify(payload);
      if (currentJson === lastSavedJsonRef.current) {
        return;
      }

      // Always keep user-scoped offline cache updated immediately
      try {
        localStorage.setItem(userStorageKey, currentJson);
      } catch {
        // ignore
      }

      setSyncStatus("saving");

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const sanitized = JSON.parse(
            JSON.stringify({
              ...payload,
              updatedAt: Date.now(),
            })
          );
          await setDoc(userDocRef, sanitized, { merge: true });
          lastSavedJsonRef.current = currentJson;
          setSyncStatus("saved");
        } catch (error) {
          console.error("TaskFlow: Error syncing to Firestore", error);
          setSyncStatus("error");
        }
      }, 800);
    });

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      unsubscribe();
    };
  }, [user, loadUserData, setIsDataLoaded, setSyncStatus]);
}
