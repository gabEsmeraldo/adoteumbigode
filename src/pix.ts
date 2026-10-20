// Static Pix "copia e cola" payload (BR Code / EMV), readable by any bank app.
const PIX_KEY = "adoteumbigodece@gmail.com";
const MERCHANT_NAME = "ADOTE UM BIGODE";
const MERCHANT_CITY = "FORTALEZA";

const field = (id: string, value: string) =>
  `${id}${value.length.toString().padStart(2, "0")}${value}`;

function crc16(payload: string) {
  let crc = 0xffff;
  for (const char of payload) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export const pixKey = PIX_KEY;

export const pixPayload = (() => {
  const body =
    field("00", "01") +
    field("26", field("00", "br.gov.bcb.pix") + field("01", PIX_KEY)) +
    field("52", "0000") +
    field("53", "986") +
    field("58", "BR") +
    field("59", MERCHANT_NAME) +
    field("60", MERCHANT_CITY) +
    field("62", field("05", "***")) +
    "6304";
  return body + crc16(body);
})();
