import { alertController } from "@ionic/core";

// App-wide confirm dialog for delete/clear actions — the same Ionic alert as
// the notifications clear/delete confirm (red Cancel / green Confirm via the
// global ion-alert CSS). Presented imperatively through alertController
// rather than a permanently mounted <IonAlert isOpen>, because a controlled
// overlay's internal "presented" flag desyncs under busy parent re-renders
// (the admin layout polls every 30s) and then silently stops opening.
// Resolves true when confirmed, false when cancelled/dismissed.
export function confirmAlert({ header, message = "", confirmText = "Confirm", cancelText = "Cancel" }) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (v) => { if (!settled) { settled = true; resolve(v); } };
    alertController
      .create({
        header,
        message,
        buttons: [
          { text: cancelText, role: "cancel" },
          { text: confirmText, handler: () => settle(true) },
        ],
      })
      .then((alert) => {
        alert.onDidDismiss().then(() => settle(false));
        alert.present();
      })
      // Never leave an action stuck if the overlay stack is wedged
      .catch(() => settle(window.confirm(message ? `${header}\n\n${message}` : header)));
  });
}

// Informational alert (single OK button), same reliable imperative pattern.
export function infoAlert({ header, message = "", cssClass, okText = "OK" }) {
  return alertController
    .create({ header, message, cssClass, buttons: [okText] })
    .then((alert) => alert.present())
    .catch(() => window.alert(message ? `${header}\n\n${message}` : header));
}
