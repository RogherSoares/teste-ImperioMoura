// --- Arquivo: js/phone-mask.js ---

function handlePhoneInput(e) {
    e.target.value = phoneMask(e.target.value);
}

function phoneMask(value) {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    return value;
}
