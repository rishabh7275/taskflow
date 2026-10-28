import i18n from "./i18n";

export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: string }).code);
    switch (code) {
      case "auth/invalid-email":
        return i18n.t("auth.invalidEmail");
      case "auth/user-disabled":
        return i18n.t("auth.userDisabled");
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return i18n.t("auth.invalidCredential");
      case "auth/email-already-in-use":
        return i18n.t("auth.emailInUse");
      case "auth/weak-password":
        return i18n.t("auth.passwordMin");
      case "auth/popup-closed-by-user":
        return i18n.t("auth.popupClosed");
      case "auth/popup-blocked":
        return i18n.t("auth.popupBlocked");
      case "auth/network-request-failed":
        return i18n.t("auth.networkFailed");
      case "auth/too-many-requests":
        return i18n.t("auth.tooManyRequests");
      case "auth/unauthorized-domain":
        return i18n.t("auth.unauthorizedDomain");
      case "auth/operation-not-allowed":
        return i18n.t("auth.operationNotAllowed");
      case "auth/account-exists-with-different-credential":
        return i18n.t("auth.accountExistsDifferentCredential");
      default:
        return (
          (error as { message?: string }).message ||
          i18n.t("auth.failed")
        );
    }
  }
  return i18n.t("auth.unexpectedError");
}
