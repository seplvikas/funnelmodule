export const formatSeplReferenceNumber = (refNumber) => {
  if (!refNumber) return refNumber;
  const ref = String(refNumber).trim();

  // Handle legacy format: "SEPL - D26131001S" → "SEPL-26D131001S"
  const legacyPattern = /^SEPL\s*-\s*D(\d{2})(\d{3})(\d{3})([A-Z])$/i;
  const legacyMatch = ref.match(legacyPattern);
  if (legacyMatch) {
    return `SEPL-${legacyMatch[1]}D${legacyMatch[2]}${legacyMatch[3]}${legacyMatch[4].toUpperCase()}`;
  }

  // New format already correct: "SEPL-26D131001S"
  return ref;
};

const sanitizeDownloadNamePart = (value, fallback = 'file') => {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || fallback;
};

export const getLastFourReferenceDigits = (refNumber, serialNumber) => {
  const refDigits = String(refNumber ?? '').replace(/\D+/g, '');
  if (refDigits.length >= 4) {
    return refDigits.slice(-4);
  }

  const serialDigits = String(serialNumber ?? '').replace(/\D+/g, '');
  if (!serialDigits) {
    return '';
  }

  return serialDigits.padStart(4, '0').slice(-4);
};

export const buildLetterDownloadBaseName = ({
  letterNumber,
  serialNumber,
  preferredName,
  fallbackName = 'letter',
} = {}) => {
  const safeBaseName = sanitizeDownloadNamePart(preferredName, fallbackName);
  
  // Format: SEPL-26D128008G (Hemraj_Increment_Letter)
  const formattedRef = formatSeplReferenceNumber(letterNumber);
  
  if (!formattedRef) {
    return safeBaseName;
  }
  
  return `${formattedRef} (${safeBaseName})`;
};

export const buildLetterDownloadFileName = ({ extension = '', ...options } = {}) => {
  const baseName = buildLetterDownloadBaseName(options);
  const normalizedExtension = String(extension || '').trim().replace(/^\./, '');
  return normalizedExtension ? `${baseName}.${normalizedExtension}` : baseName;
};
