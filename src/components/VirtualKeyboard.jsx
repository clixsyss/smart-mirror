import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VirtualKeyboard.css';

const VirtualKeyboard = ({ isVisible, onClose, onInput, inputRef, currentValue = '' }) => {
  const [isShift, setIsShift] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [currentLayout, setCurrentLayout] = useState('letters');

  // Keyboard layouts
  const layouts = {
    letters: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
      ['123', 'space', '@', '.', 'enter']
    ],
    numbers: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
      ['symbols', '.', ',', '?', '!', "'", 'backspace'],
      ['abc', 'space', '@', '.', 'enter']
    ],
    symbols: [
      ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
      ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
      ['123', '.', ',', '?', '!', "'", 'backspace'],
      ['abc', 'space', '@', '.', 'enter']
    ]
  };

  const handleKeyPress = (key) => {
    if (!inputRef?.current) return;

    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    switch (key) {
      case 'backspace':
        if (currentValue.length > 0) {
          // Always delete from the end
          const newValue = currentValue.slice(0, -1);
          onInput(newValue);
          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(newValue.length, newValue.length);
            }
          }, 10);
        }
        break;

      case 'enter':
        // Submit form or close keyboard
        const form = input.closest('form');
        if (form) {
          form.requestSubmit();
        }
        break;

      case 'space':
        const newValue = currentValue + ' ';
        onInput(newValue);
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(newValue.length, newValue.length);
          }
        }, 10);
        break;

      case 'shift':
        setIsShift(!isShift);
        break;

      case 'caps':
        setIsCapsLock(!isCapsLock);
        setIsShift(false);
        break;

      case '123':
        setCurrentLayout('numbers');
        break;

      case 'abc':
        setCurrentLayout('letters');
        break;

      case 'symbols':
        setCurrentLayout('symbols');
        break;

      default:
        // Regular character input
        let char = key;
        if (currentLayout === 'letters') {
          if (isShift || isCapsLock) {
            char = char.toUpperCase();
          }
          // Reset shift after typing (but not caps lock)
          if (isShift && !isCapsLock) {
            setIsShift(false);
          }
        }
        
        // Insert character at cursor position - always append to end for now
        const newValueChar = currentValue + char;
        onInput(newValueChar);
        
        // Move cursor to end
        setTimeout(() => {
          if (input) {
            input.focus();
            const newLength = newValueChar.length;
            input.setSelectionRange(newLength, newLength);
          }
        }, 10);
        break;
    }
  };

  const getKeyLabel = (key) => {
    const keyLabels = {
      'backspace': '⌫',
      'enter': '↵',
      'space': '⎵',
      'shift': '⇧',
      'caps': '⇪',
      '123': '123',
      'abc': 'ABC',
      'symbols': '#+=',
      '@': '@',
      '.': '.'
    };

    if (keyLabels[key]) {
      return keyLabels[key];
    }

    if (currentLayout === 'letters') {
      if (isShift || isCapsLock) {
        return key.toUpperCase();
      }
    }

    return key;
  };

  const getKeyClass = (key) => {
    let classes = 'virtual-key';
    
    // Special key styling
    if (['backspace', 'enter', 'shift', 'caps', '123', 'abc', 'symbols'].includes(key)) {
      classes += ' special-key';
    }
    
    // Space key styling
    if (key === 'space') {
      classes += ' space-key';
    }
    
    // Active state styling
    if (key === 'shift' && isShift) {
      classes += ' active';
    }
    if (key === 'caps' && isCapsLock) {
      classes += ' active';
    }
    
    return classes;
  };

  // Close keyboard when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isVisible && !event.target.closest('.virtual-keyboard-container')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`virtual-keyboard-overlay ${isVisible ? 'visible' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="virtual-keyboard-container"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: 0.4
            }}
          >
            {/* Mobile-style Header */}
            <div className="keyboard-header">
              <button className="keyboard-close" onClick={onClose}>
                ⌄
              </button>
            </div>

            {/* Keyboard Layout */}
            <div className="keyboard-layout">
              {layouts[currentLayout].map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.map((key, keyIndex) => (
                    <motion.button
                      key={`${key}-${keyIndex}`}
                      className={getKeyClass(key)}
                      onClick={() => handleKeyPress(key)}
                      whileTap={{ 
                        scale: 0.92,
                        transition: { duration: 0.1 }
                      }}
                      initial={{ scale: 1 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      {getKeyLabel(key)}
                    </motion.button>
                  ))}
                </div>
              ))}
            </div>

            {/* Layout Indicators */}
            <div className="keyboard-indicators">
              <div className="layout-indicator">
                {currentLayout === 'letters' && (isShift || isCapsLock) && (
                  <span className="caps-indicator">
                    {isCapsLock ? 'CAPS' : 'SHIFT'}
                  </span>
                )}
                <span className="layout-name">
                  {currentLayout.toUpperCase()}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VirtualKeyboard;
