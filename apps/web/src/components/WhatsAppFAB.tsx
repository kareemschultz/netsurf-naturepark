import { contacts } from "@workspace/shared"
import { WhatsAppIcon } from "./WhatsAppIcon"

export function WhatsAppFAB() {
  return (
    <a
      href={contacts.whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#25D366] active:scale-95 sm:right-5"
      style={{ backgroundColor: "#25D366" }}
    >
      <WhatsAppIcon className="h-7 w-7 text-white" />
    </a>
  )
}
