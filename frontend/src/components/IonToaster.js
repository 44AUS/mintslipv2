import { useEffect } from "react";
import { useIonToast } from "@ionic/react";
import { registerToast } from "@/utils/toast";

// Mount once at the app root. Wires the imperative showToast() bridge to
// Ionic's toast presenter so notifications can be fired from anywhere in the
// app — same pattern as the whodat Toaster host.
const IonToaster = () => {
  const [present] = useIonToast();
  useEffect(() => registerToast((cfg) => present(cfg)), [present]);
  return null;
};

export default IonToaster;
