const qr = require("@dipser/epc-qr-code.js");

exports.generateSepaQrCode = function (name, iban, bic, amount, reason) {
  const qrCode = qr.girocode({
    name,
    iban,
    bic,
    amount,
    reason,
  });
  return qrCode.svg();
};
