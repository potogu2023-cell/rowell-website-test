export const WHATSAPP_PHONE_E164 = "+8618930539593";
export const WHATSAPP_DEFAULT_MESSAGE = "Hello! I'm interested in your chromatography consumables and would like to submit an inquiry.";
export const WHATSAPP_QR_CODE_SRC = "/images/gw-wa.png";

export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_PHONE_E164.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
