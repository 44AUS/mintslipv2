const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export async function saveGuestDocument(blob, guestEmail, documentType, fileName) {
  if (!blob || !guestEmail) return;
  try {
    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    await fetch(`${BACKEND_URL}/api/guest/saved-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestEmail, documentType, fileName, fileData: base64 }),
    });
  } catch (err) {
    console.error("Failed to save guest document:", err);
  }
}
