import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  sanitizeText,
  sanitizeHTML,
  sanitizeUrl,
  validateEmail,
  validatePhoneNumber,
  truncateText,
  escapeHtml,
  containsXSS,
} from '../utils/sanitization';

export function useSanitization(options = {}) {
  const { debounceMs = 300, maxLength = 255 } = options;
  
  const [validationState, setValidationState] = useState({});
  const debounceTimers = useRef({});
  
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);
  
  const sanitize = useCallback((fieldName, value, type = 'text') => {
    let sanitized;
    let isValid = true;
    let error = null;
    let warning = null;
    
    if (containsXSS(value)) {
      warning = 'Potentially unsafe content detected and sanitized';
    }
    
    switch (type) {
      case 'html':
        sanitized = sanitizeHTML(value);
        break;
      case 'url':
        sanitized = sanitizeUrl(value);
        if (value && !sanitized) {
          isValid = false;
          error = 'Invalid URL format';
        }
        break;
      case 'email': {
        const emailResult = validateEmail(value);
        sanitized = emailResult.sanitized || '';
        isValid = emailResult.isValid;
        error = emailResult.error;
        break;
      }
      case 'phone': {
        const phoneResult = validatePhoneNumber(value);
        sanitized = phoneResult.sanitized || '';
        isValid = phoneResult.isValid;
        error = phoneResult.error;
        break;
      }
      case 'text':
      default:
        sanitized = truncateText(sanitizeText(value), maxLength);
        break;
    }
    
    setValidationState(prev => ({
      ...prev,
      [fieldName]: { isValid, error, warning, hasChanges: value !== sanitized },
    }));
    
    return sanitized;
  }, [maxLength]);
  
  const debouncedSanitize = useCallback((fieldName, value, type = 'text', callback) => {
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }
    
    debounceTimers.current[fieldName] = setTimeout(() => {
      const result = sanitize(fieldName, value, type);
      if (callback) {
        callback(result);
      }
    }, debounceMs);
  }, [debounceMs, sanitize]);
  
  const clearValidation = useCallback((fieldName) => {
    if (fieldName) {
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
    } else {
      setValidationState({});
    }
  }, []);
  
  const getFieldState = useCallback((fieldName) => {
    return validationState[fieldName] || { isValid: true, error: null, warning: null };
  }, [validationState]);
  
  const hasErrors = useMemo(() => {
    return Object.values(validationState).some(state => !state.isValid);
  }, [validationState]);
  
  const hasWarnings = useMemo(() => {
    return Object.values(validationState).some(state => state.warning);
  }, [validationState]);
  
  return {
    sanitize,
    debouncedSanitize,
    sanitizeText,
    sanitizeHTML,
    sanitizeUrl,
    validateEmail,
    validatePhoneNumber,
    truncateText,
    escapeHtml,
    validationState,
    getFieldState,
    clearValidation,
    hasErrors,
    hasWarnings,
  };
}

export function useDebouncedInput(initialValue = '', options = {}) {
  const { sanitize: shouldSanitize = true, maxLength = 255, debounceMs = 300 } = options;
  
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      let processed = newValue;
      
      if (shouldSanitize) {
        processed = sanitizeText(newValue);
        processed = truncateText(processed, maxLength);
        
        if (containsXSS(newValue)) {
          setError('Invalid characters were removed');
        } else {
          setError(null);
        }
      }
      
      setDebouncedValue(processed);
    }, debounceMs);
  }, [shouldSanitize, maxLength, debounceMs]);
  
  const reset = useCallback((newValue = initialValue) => {
    setValue(newValue);
    setDebouncedValue(newValue);
    setError(null);
  }, [initialValue]);
  
  return {
    value,
    debouncedValue,
    error,
    handleChange,
    reset,
    setValue,
  };
}
